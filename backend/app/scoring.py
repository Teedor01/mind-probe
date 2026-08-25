"""
Deterministic scoring/state logic. The LLM only ever returns assessments;
this module is the sole place that turns an assessment into a score change
or a phase transition. Keeping this separate is the core engineering
constraint of MindProbe: reasoning layer != application logic.
"""

from sqlalchemy.orm import Session as DBSession

from app.concept_graph import CONCEPTS_BY_ID, WEAK_THRESHOLD, dependents_of
from app.models import ConceptState, StudySession

MIN_PROBES_PER_CONCEPT = 3  # always ask at least this many before conceding early
MAX_PROBES_PER_CONCEPT = 4  # hard ceiling regardless of answers
MISCONCEPTION_PENALTY = 25  # cap applied when a concept is explicitly named in a misconception


def init_concept_states(db: DBSession, session: StudySession) -> None:
    for concept_id in CONCEPTS_BY_ID:
        db.add(
            ConceptState(
                session_id=session.id,
                concept_id=concept_id,
                baseline_score=0.0,
                current_score=0.0,
                status="unprobed",
            )
        )
    db.commit()


def get_states(db: DBSession, session_id: str) -> dict[str, ConceptState]:
    rows = db.query(ConceptState).filter(ConceptState.session_id == session_id).all()
    return {r.concept_id: r for r in rows}


def apply_explanation_assessment(db: DBSession, session: StudySession, assessment: dict) -> None:
    """Turn the teach-phase LLM assessment into baseline concept scores."""
    states = get_states(db, session.id)
    misconception_concepts = _extract_misconception_concept_ids(assessment)

    for cc in assessment.get("concept_confidences", []):
        concept_id = cc["concept_id"]
        if concept_id not in states:
            continue
        score = float(cc["confidence"])
        if concept_id in misconception_concepts:
            score = min(score, MISCONCEPTION_PENALTY)
        state = states[concept_id]
        state.baseline_score = score
        state.current_score = score
        state.evidence = cc.get("reasoning", "")
        state.status = "weak" if score < WEAK_THRESHOLD else "strong"
        db.add(state)
    db.commit()


def _extract_misconception_concept_ids(assessment: dict) -> set[str]:
    """Cheap deterministic scan: if a concept id string appears inside any
    misconception sentence, treat that concept as implicated. The LLM was
    instructed to name concept ids explicitly in misconceptions[]."""
    ids = set()
    for m in assessment.get("misconceptions", []):
        for concept_id in CONCEPTS_BY_ID:
            if concept_id.replace("_", " ") in m.lower() or concept_id in m.lower():
                ids.add(concept_id)
    return ids


def select_root_cause(db: DBSession, session_id: str) -> str:
    """Walk the chain from most foundational to most advanced; return the
    id of the FIRST concept below the weak threshold. This is 'the earliest
    broken prerequisite', not just the single lowest-scoring concept."""
    states = get_states(db, session_id)
    from app.concept_graph import CONCEPT_ORDER

    for concept_id in CONCEPT_ORDER:
        if states[concept_id].current_score < WEAK_THRESHOLD:
            return concept_id
    # nothing below threshold: return the lowest-scoring concept anyway
    return min(states.values(), key=lambda s: s.current_score).concept_id


def apply_probe_answer(
    db: DBSession, session: StudySession, concept_id: str, assessment: dict
) -> ConceptState:
    states = get_states(db, session.id)
    state = states[concept_id]

    llm_score = 90.0 if assessment["correct"] else max(0.0, 40.0 - (100 - assessment["confidence"]) / 5)
    if assessment["correct"]:
        llm_score = min(100.0, 60 + assessment["confidence"] * 0.4)

    # Blend with prior score so one lucky answer doesn't fully overwrite history.
    state.current_score = round(0.35 * state.current_score + 0.65 * llm_score, 1)
    state.evidence = assessment.get("evidence_quote", state.evidence)
    state.status = "resolved" if assessment.get("misconception_resolved") else "probing"
    db.add(state)

    session.probe_count += 1
    db.add(session)
    db.commit()
    db.refresh(state)
    return state


def ready_for_intervention(session: StudySession, assessment: dict) -> bool:
    """Always ask at least MIN_PROBES_PER_CONCEPT questions — even a correct
    early answer doesn't end the loop right away — but never exceed MAX."""
    if session.probe_count < MIN_PROBES_PER_CONCEPT:
        return False
    if assessment.get("misconception_resolved"):
        return True
    return session.probe_count >= MAX_PROBES_PER_CONCEPT


def apply_retest_result(
    db: DBSession, session: StudySession, concept_id: str, assessment: dict
) -> dict[str, ConceptState]:
    """Fixing a root-cause concept should also lift confidence in the
    concepts that depend on it — that's the actual product claim."""
    states = get_states(db, session.id)
    state = states[concept_id]

    if assessment["correct"] and assessment.get("misconception_resolved"):
        state.current_score = max(state.current_score + 40, 85.0)
        state.current_score = min(state.current_score, 100.0)
        state.status = "resolved"
    else:
        state.current_score = min(state.current_score + 10.0, 100.0)
        state.status = "probing"
    db.add(state)

    if assessment["correct"] and assessment.get("misconception_resolved"):
        for dep_id in dependents_of(concept_id):
            dep = states[dep_id]
            if dep.current_score < 90:
                dep.current_score = min(dep.current_score + 30.0, 92.0)
                dep.status = "strong" if dep.current_score >= WEAK_THRESHOLD else dep.status
                db.add(dep)

    db.commit()
    return get_states(db, session.id)
