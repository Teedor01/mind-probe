import os

os.environ["DATABASE_URL"] = "sqlite:///./test_offline.db"

from app.database import Base, SessionLocal, engine, init_db  # noqa: E402
from app.diagnosis import build_diagnosis, concept_scores_payload  # noqa: E402
from app.models import StudySession  # noqa: E402
from app import scoring  # noqa: E402

Base.metadata.drop_all(bind=engine)
init_db()
db = SessionLocal()

session = StudySession(topic="gradient_descent", phase="teach")
db.add(session)
db.commit()
db.refresh(session)
scoring.init_concept_states(db, session)
print("Created session:", session.id)

mock_teach_assessment = {
    "claims": ["Gradient tells us how much we should change the weights"],
    "correct_reasoning": ["Understands gradient relates to weight updates"],
    "incorrect_reasoning": ["Conflates gradient with the update magnitude"],
    "missing_concepts": ["learning_rate"],
    "misconceptions": [
        "Student believes the gradient alone determines how much to change weights, "
        "conflating gradient with learning_rate"
    ],
    "concept_confidences": [
        {"concept_id": "slope", "confidence": 85, "reasoning": "solid"},
        {"concept_id": "derivative", "confidence": 75, "reasoning": "solid"},
        {"concept_id": "gradient", "confidence": 55, "reasoning": "partial, conflated with step size"},
        {"concept_id": "learning_rate", "confidence": 20, "reasoning": "not distinguished from gradient"},
        {"concept_id": "gradient_descent", "confidence": 50, "reasoning": "mechanically ok, conceptually shaky"},
    ],
    "overall_summary": "Confuses gradient (direction) with learning rate (step size).",
}

scoring.apply_explanation_assessment(db, session, mock_teach_assessment)
root_cause = scoring.select_root_cause(db, session.id)
session.target_concept_id = root_cause
session.misconception_summary = mock_teach_assessment["misconceptions"][0]
session.phase = "diagnosis"
db.add(session)
db.commit()
db.refresh(session)

diagnosis = build_diagnosis(db, session)
print("\n--- DIAGNOSIS ---")
for c in diagnosis["concept_scores"]:
    print(f"  {c['name']:<16} {c['score']:>5}  ({c['status']})")
print("Root cause / target:", diagnosis["target_concept_name"], f"({root_cause})")
print("Misconception:", diagnosis["misconception_summary"])


assert root_cause == "gradient", f"expected gradient, got {root_cause}"


mock_probe_assessment = {
    "correct": True,
    "confidence": 90,
    "misconception_resolved": True,
    "reasoning": "Correctly distinguishes direction (gradient) from step size (learning rate).",
    "evidence_quote": "The learning rate decides how big a step, the gradient just says which way.",
}

scoring.apply_probe_answer(db, session, root_cause, mock_probe_assessment)
ready_after_1 = scoring.ready_for_intervention(session, mock_probe_assessment)
print("\nReady for intervention after 1 probe (should be False, min is 3):", ready_after_1)
assert ready_after_1 is False

scoring.apply_probe_answer(db, session, root_cause, mock_probe_assessment)
ready_after_2 = scoring.ready_for_intervention(session, mock_probe_assessment)
print("Ready for intervention after 2 probes (should still be False):", ready_after_2)
assert ready_after_2 is False

scoring.apply_probe_answer(db, session, root_cause, mock_probe_assessment)
ready_after_3 = scoring.ready_for_intervention(session, mock_probe_assessment)
print("Ready for intervention after 3 probes, resolved=True (should be True):", ready_after_3)
assert ready_after_3 is True


session.probe_count = 0
unresolved_assessment = {**mock_probe_assessment, "misconception_resolved": False}
for i in range(4):
    scoring.apply_probe_answer(db, session, root_cause, unresolved_assessment)
ready_at_ceiling = scoring.ready_for_intervention(session, unresolved_assessment)
print("Ready for intervention at 4 probes, still unresolved (should be True, hard ceiling):", ready_at_ceiling)
assert ready_at_ceiling is True


mock_retest_assessment = {
    "correct": True,
    "confidence": 92,
    "misconception_resolved": True,
    "reasoning": "New scenario answered correctly, no conflation present.",
    "evidence_quote": "Learning rate of 0.01 scales the gradient's direction into an actual step.",
}
before = concept_scores_payload(db, session.id)
scoring.apply_retest_result(db, session, root_cause, mock_retest_assessment)
after = concept_scores_payload(db, session.id)

print("\n--- BEFORE vs AFTER ---")
before_map = {c["concept_id"]: c["score"] for c in before}
for c in after:
    print(f"  {c['name']:<16} {before_map[c['concept_id']]:>5} -> {c['score']:>5}")

after_map = {c["concept_id"]: c["score"] for c in after}
assert after_map[root_cause] >= 85, "the resolved root-cause concept should score high"
assert after_map["gradient_descent"] > before_map["gradient_descent"], "downstream concept should lift too"
assert after_map["learning_rate"] > before_map["learning_rate"], "downstream concept should lift too"

print("\nALL OFFLINE ASSERTIONS PASSED")
db.close()
