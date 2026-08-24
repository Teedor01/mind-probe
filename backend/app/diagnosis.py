from sqlalchemy.orm import Session as DBSession

from app.concept_graph import CONCEPT_ORDER, CONCEPTS_BY_ID
from app.models import StudySession
from app.scoring import get_states


def concept_scores_payload(db: DBSession, session_id: str) -> list[dict]:
    states = get_states(db, session_id)
    return [
        {
            "concept_id": cid,
            "name": CONCEPTS_BY_ID[cid].name,
            "score": states[cid].current_score,
            "status": states[cid].status,
        }
        for cid in CONCEPT_ORDER
    ]


def build_diagnosis(db: DBSession, session: StudySession) -> dict:
    scores = concept_scores_payload(db, session.id)
    target = CONCEPTS_BY_ID.get(session.target_concept_id) if session.target_concept_id else None
    states = get_states(db, session.id)
    evidence = states[session.target_concept_id].evidence if session.target_concept_id else None

    return {
        "session_id": session.id,
        "phase": session.phase,
        "concept_scores": scores,
        "misconception_summary": session.misconception_summary,
        "target_concept_id": session.target_concept_id,
        "target_concept_name": target.name if target else None,
        "evidence": evidence,
    }
