import json
import os

import anthropic

from app.concept_graph import CONCEPTS, Concept

MODEL = os.getenv("ANTHROPIC_MODEL", "claude-sonnet-5")

_client: anthropic.Anthropic | None = None


def _get_client() -> anthropic.Anthropic:
    global _client
    if _client is None:
        api_key = os.getenv("ANTHROPIC_API_KEY")
        if not api_key:
            raise RuntimeError(
                "ANTHROPIC_API_KEY is not set. Add it to backend/.env before "
                "running any teach/probe/retest endpoint."
            )
        _client = anthropic.Anthropic(api_key=api_key)
    return _client


def _concept_chain_text() -> str:
    return "\n".join(
        f"{i + 1}. {c.name} ({c.id}) — {c.description}\n   Ground truth: {c.ground_truth}"
        for i, c in enumerate(CONCEPTS)
    )


def _force_tool_call(tool_name: str, tool_schema: dict, system: str, user_message: str) -> dict:
    client = _get_client()
    response = client.messages.create(
        model=MODEL,
        max_tokens=1500,
        system=system,
        tools=[
            {
                "name": tool_name,
                "description": f"Record the {tool_name} result as structured data.",
                "input_schema": tool_schema,
            }
        ],
        tool_choice={"type": "tool", "name": tool_name},
        messages=[{"role": "user", "content": user_message}],
    )
    for block in response.content:
        if block.type == "tool_use" and block.name == tool_name:
            return block.input
    raise RuntimeError(f"Model did not return the expected tool call ({tool_name}).")



EXPLANATION_ASSESSMENT_SCHEMA = {
    "type": "object",
    "properties": {
        "claims": {"type": "array", "items": {"type": "string"}},
        "correct_reasoning": {"type": "array", "items": {"type": "string"}},
        "incorrect_reasoning": {"type": "array", "items": {"type": "string"}},
        "missing_concepts": {"type": "array", "items": {"type": "string"}},
        "misconceptions": {"type": "array", "items": {"type": "string"}},
        "concept_confidences": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "concept_id": {"type": "string", "enum": [c.id for c in CONCEPTS]},
                    "confidence": {"type": "integer", "minimum": 0, "maximum": 100},
                    "reasoning": {"type": "string"},
                },
                "required": ["concept_id", "confidence", "reasoning"],
            },
        },
        "overall_summary": {"type": "string"},
    },
    "required": [
        "claims",
        "correct_reasoning",
        "incorrect_reasoning",
        "missing_concepts",
        "misconceptions",
        "concept_confidences",
        "overall_summary",
    ],
}


def assess_explanation(explanation: str) -> dict:
    system = (
        "You are a reasoning-extraction engine for MindProbe, a diagnostic learning tool. "
        "You do NOT teach or praise. You extract and score understanding.\n\n"
        "Fixed prerequisite chain for this session:\n"
        f"{_concept_chain_text()}\n\n"
        "Given a student's free-form explanation of gradient descent, evaluate their "
        "understanding of EACH of the 5 concepts above independently, even ones they "
        "didn't explicitly mention (confidence 0 if entirely absent). Be precise about "
        "which specific claims are correct vs incorrect. If the student conflates two "
        "concepts (e.g. gradient vs learning rate), call that out explicitly in "
        "misconceptions with both concept ids named."
    )
    return _force_tool_call(
        "record_explanation_assessment",
        EXPLANATION_ASSESSMENT_SCHEMA,
        system,
        f"Student's explanation of gradient descent:\n\n\"{explanation}\"",
    )



def generate_probe_question(concept: Concept, evidence: str, probe_number: int) -> str:
    system = (
        "You are MindProbe's Socratic questioner. Your only job is to ask ONE short, "
        "sharp diagnostic question that will reveal whether the student actually "
        "understands the concept below — not a leading question, not one that gives "
        "away the answer. Output ONLY the question text, nothing else."
    )
    user_message = (
        f"Concept to probe: {concept.name}\n"
        f"Ground truth: {concept.ground_truth}\n"
        f"Evidence so far of the student's understanding: {evidence}\n"
        f"This is probe question #{probe_number} for this concept.\n\n"
        "Ask one question that would expose whether they hold the misconception "
        "or genuinely understand this concept."
    )
    client = _get_client()
    response = client.messages.create(
        model=MODEL,
        max_tokens=200,
        system=system,
        messages=[{"role": "user", "content": user_message}],
    )
    text = "".join(b.text for b in response.content if b.type == "text").strip()
    return text or concept.fallback_question



ANSWER_ASSESSMENT_SCHEMA = {
    "type": "object",
    "properties": {
        "correct": {"type": "boolean"},
        "confidence": {"type": "integer", "minimum": 0, "maximum": 100},
        "misconception_resolved": {"type": "boolean"},
        "reasoning": {"type": "string"},
        "evidence_quote": {"type": "string"},
    },
    "required": ["correct", "confidence", "misconception_resolved", "reasoning", "evidence_quote"],
}


def assess_answer(concept: Concept, question: str, answer: str, known_misconception: str) -> dict:
    system = (
        "You are MindProbe's answer grader. Grade strictly against the ground truth. "
        "Do not be generous — vague or partially-correct answers should not be marked "
        "fully correct. 'misconception_resolved' should only be true if the answer "
        "clearly no longer exhibits the known misconception described below."
    )
    user_message = (
        f"Concept: {concept.name}\n"
        f"Ground truth: {concept.ground_truth}\n"
        f"Known misconception being tested: {known_misconception or 'none identified yet'}\n"
        f"Question asked: {question}\n"
        f"Student's answer: \"{answer}\"\n\n"
        "Assess this answer."
    )
    return _force_tool_call("record_answer_assessment", ANSWER_ASSESSMENT_SCHEMA, system, user_message)




def generate_intervention(concept: Concept, misconception: str) -> str:
    system = (
        "You write the smallest possible correction, not a lecture. 3-5 sentences "
        "maximum, plain language, directly naming and correcting the specific "
        "misconception. No greeting, no praise, no unrelated background. End with the "
        "one sentence that most directly fixes the confusion."
    )
    user_message = (
        f"Concept: {concept.name}\n"
        f"Ground truth: {concept.ground_truth}\n"
        f"Student's misconception: {misconception}\n\n"
        "Write the minimal correction."
    )
    client = _get_client()
    response = client.messages.create(
        model=MODEL,
        max_tokens=250,
        system=system,
        messages=[{"role": "user", "content": user_message}],
    )
    text = "".join(b.text for b in response.content if b.type == "text").strip()
    return text



def generate_retest_question(concept: Concept, misconception: str) -> str:
    system = (
        "Write ONE new question, different in surface form from a typical definition "
        "question, that specifically tests whether the named misconception has been "
        "fixed. It should be impossible to answer correctly while still holding the "
        "misconception. Output ONLY the question."
    )
    user_message = (
        f"Concept: {concept.name}\n"
        f"Ground truth: {concept.ground_truth}\n"
        f"Misconception that was just corrected: {misconception}\n"
    )
    client = _get_client()
    response = client.messages.create(
        model=MODEL,
        max_tokens=200,
        system=system,
        messages=[{"role": "user", "content": user_message}],
    )
    text = "".join(b.text for b in response.content if b.type == "text").strip()
    return text or concept.fallback_question
