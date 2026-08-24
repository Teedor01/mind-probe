from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session as DBSession

from app import llm, scoring
from app.concept_graph import CONCEPTS_BY_ID
from app.database import get_db
from app.diagnosis import build_diagnosis, concept_scores_payload
from app.models import Interaction, StudySession
from app.schemas import (
    DiagnosisOut,
    InterventionOut,
    ProbeAnswerOut,
    ProbeAnswerRequest,
    ProbeQuestionOut,
    RetestAnswerRequest,
    RetestQuestionOut,
    RetestResultOut,
    TeachRequest,
)

router = APIRouter(prefix="/api/sessions", tags=["sessions"])


def _get_session(db: DBSession, session_id: str) -> StudySession:
    session = db.get(StudySession, session_id)
    if not session:
        raise HTTPException(404, "Session not found")
    return session


@router.post("", response_model=DiagnosisOut)
def create_session(db: DBSession = Depends(get_db)):
    session = StudySession(topic="gradient_descent", phase="teach")
    db.add(session)
    db.commit()
    db.refresh(session)
    scoring.init_concept_states(db, session)
    return build_diagnosis(db, session)


@router.post("/{session_id}/teach", response_model=DiagnosisOut)
def teach(session_id: str, body: TeachRequest, db: DBSession = Depends(get_db)):
    session = _get_session(db, session_id)

    assessment = llm.assess_explanation(body.explanation)

    db.add(
        Interaction(
            session_id=session.id,
            phase="teach",
            student_response=body.explanation,
            llm_assessment=assessment,
        )
    )
    scoring.apply_explanation_assessment(db, session, assessment)

    root_cause_id = scoring.select_root_cause(db, session.id)
    session.target_concept_id = root_cause_id
    session.misconception_summary = _summarize_misconception(assessment, root_cause_id)
    session.phase = "diagnosis"
    db.add(session)
    db.commit()
    db.refresh(session)

    return build_diagnosis(db, session)


def _summarize_misconception(assessment: dict, root_cause_id: str) -> str:
    concept_name = CONCEPTS_BY_ID[root_cause_id].name
    for m in assessment.get("misconceptions", []):
        if root_cause_id.replace("_", " ") in m.lower() or root_cause_id in m.lower():
            return m
    if assessment.get("misconceptions"):
        return assessment["misconceptions"][0]
    return f"Understanding of {concept_name} was too weak to confirm from the explanation alone."


@router.get("/{session_id}/diagnosis", response_model=DiagnosisOut)
def get_diagnosis(session_id: str, db: DBSession = Depends(get_db)):
    session = _get_session(db, session_id)
    return build_diagnosis(db, session)


@router.post("/{session_id}/probe", response_model=ProbeQuestionOut)
def probe(session_id: str, db: DBSession = Depends(get_db)):
    session = _get_session(db, session_id)
    if not session.target_concept_id:
        raise HTTPException(400, "No diagnosis yet — call /teach first")

    concept = CONCEPTS_BY_ID[session.target_concept_id]
    states = scoring.get_states(db, session.id)
    evidence = states[concept.id].evidence or "no prior evidence"

    session.phase = "probing"
    db.add(session)
    db.commit()

    question = llm.generate_probe_question(concept, evidence, session.probe_count + 1)

    db.add(
        Interaction(
            session_id=session.id,
            phase="probe",
            concept_id=concept.id,
            prompt=question,
            student_response="",
            llm_assessment={},
        )
    )
    db.commit()

    return ProbeQuestionOut(
        session_id=session.id,
        concept_id=concept.id,
        concept_name=concept.name,
        question=question,
        probe_number=session.probe_count + 1,
    )


@router.post("/{session_id}/probe/answer", response_model=ProbeAnswerOut)
def probe_answer(session_id: str, body: ProbeAnswerRequest, db: DBSession = Depends(get_db)):
    session = _get_session(db, session_id)
    concept = CONCEPTS_BY_ID[body.concept_id]

    last_probe = (
        db.query(Interaction)
        .filter(
            Interaction.session_id == session.id,
            Interaction.phase == "probe",
            Interaction.concept_id == concept.id,
            Interaction.student_response == "",
        )
        .order_by(Interaction.created_at.desc())
        .first()
    )
    question_text = last_probe.prompt if last_probe else concept.fallback_question

    assessment = llm.assess_answer(concept, question_text, body.answer, session.misconception_summary or "")

    if last_probe:
        last_probe.student_response = body.answer
        last_probe.llm_assessment = assessment
        db.add(last_probe)
    else:
        db.add(
            Interaction(
                session_id=session.id,
                phase="probe",
                concept_id=concept.id,
                prompt=question_text,
                student_response=body.answer,
                llm_assessment=assessment,
            )
        )
    scoring.apply_probe_answer(db, session, concept.id, assessment)

    ready = scoring.ready_for_intervention(session, assessment)
    if ready:
        session.phase = "intervention"
        db.add(session)
        db.commit()

    return ProbeAnswerOut(
        session_id=session.id,
        correct=assessment["correct"],
        reasoning=assessment["reasoning"],
        updated_scores=concept_scores_payload(db, session.id),
        ready_for_intervention=ready,
        misconception_resolved=assessment.get("misconception_resolved", False),
    )


@router.post("/{session_id}/intervention", response_model=InterventionOut)
def intervention(session_id: str, db: DBSession = Depends(get_db)):
    session = _get_session(db, session_id)
    concept = CONCEPTS_BY_ID[session.target_concept_id]

    text = llm.generate_intervention(concept, session.misconception_summary or "")

    session.phase = "retest"
    db.add(session)
    db.commit()

    return InterventionOut(
        session_id=session.id,
        concept_id=concept.id,
        concept_name=concept.name,
        intervention_text=text,
    )


@router.post("/{session_id}/retest", response_model=RetestQuestionOut)
def retest(session_id: str, db: DBSession = Depends(get_db)):
    session = _get_session(db, session_id)
    concept = CONCEPTS_BY_ID[session.target_concept_id]

    question = llm.generate_retest_question(concept, session.misconception_summary or "")

    db.add(
        Interaction(
            session_id=session.id,
            phase="retest",
            concept_id=concept.id,
            prompt=question,
            student_response="",
            llm_assessment={},
        )
    )
    db.commit()

    return RetestQuestionOut(session_id=session.id, concept_id=concept.id, question=question)


@router.post("/{session_id}/retest/answer", response_model=RetestResultOut)
def retest_answer(session_id: str, body: RetestAnswerRequest, db: DBSession = Depends(get_db)):
    session = _get_session(db, session_id)
    concept = CONCEPTS_BY_ID[session.target_concept_id]

    before_scores = concept_scores_payload(db, session.id)

    last_retest = (
        db.query(Interaction)
        .filter(
            Interaction.session_id == session.id,
            Interaction.phase == "retest",
            Interaction.student_response == "",
        )
        .order_by(Interaction.created_at.desc())
        .first()
    )
    question_text = last_retest.prompt if last_retest else concept.fallback_question

    assessment = llm.assess_answer(concept, question_text, body.answer, session.misconception_summary or "")

    last_retest.student_response = body.answer
    last_retest.llm_assessment = assessment
    db.add(last_retest)

    scoring.apply_retest_result(db, session, concept.id, assessment)

    session.phase = "done"
    db.add(session)
    db.commit()

    return RetestResultOut(
        session_id=session.id,
        correct=assessment["correct"],
        misconception_resolved=assessment.get("misconception_resolved", False),
        reasoning=assessment["reasoning"],
        before_scores=before_scores,
        after_scores=concept_scores_payload(db, session.id),
    )
