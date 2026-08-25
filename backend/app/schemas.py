from pydantic import BaseModel, Field




class ConceptConfidence(BaseModel):
    concept_id: str
    confidence: int = Field(ge=0, le=100)
    reasoning: str


class ExplanationAssessment(BaseModel):
    """What the LLM returns after reading the student's free-form explanation."""

    claims: list[str]
    correct_reasoning: list[str]
    incorrect_reasoning: list[str]
    missing_concepts: list[str]
    misconceptions: list[str]
    concept_confidences: list[ConceptConfidence]
    overall_summary: str


class AnswerAssessment(BaseModel):
    """What the LLM returns after reading a student's answer to one diagnostic question."""

    correct: bool
    confidence: int = Field(ge=0, le=100)
    misconception_resolved: bool
    reasoning: str
    evidence_quote: str




class LessonOut(BaseModel):
    session_id: str
    lesson_text: str


class TeachRequest(BaseModel):
    explanation: str = Field(min_length=1)


class ProbeAnswerRequest(BaseModel):
    concept_id: str
    answer: str = Field(min_length=1)


class RetestAnswerRequest(BaseModel):
    answer: str = Field(min_length=1)




class ConceptScoreOut(BaseModel):
    concept_id: str
    name: str
    score: float
    status: str


class DiagnosisOut(BaseModel):
    session_id: str
    phase: str
    concept_scores: list[ConceptScoreOut]
    misconception_summary: str | None
    target_concept_id: str | None
    target_concept_name: str | None
    evidence: str | None


class ProbeQuestionOut(BaseModel):
    session_id: str
    concept_id: str
    concept_name: str
    question: str
    probe_number: int


class ProbeAnswerOut(BaseModel):
    session_id: str
    correct: bool
    reasoning: str
    updated_scores: list[ConceptScoreOut]
    ready_for_intervention: bool
    misconception_resolved: bool


class InterventionOut(BaseModel):
    session_id: str
    concept_id: str
    concept_name: str
    intervention_text: str


class RetestQuestionOut(BaseModel):
    session_id: str
    concept_id: str
    question: str


class RetestResultOut(BaseModel):
    session_id: str
    correct: bool
    misconception_resolved: bool
    reasoning: str
    before_scores: list[ConceptScoreOut]
    after_scores: list[ConceptScoreOut]
