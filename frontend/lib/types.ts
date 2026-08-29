export type Lesson = {
  session_id: string;
  lesson_text: string;
};

export type ConceptScore = {
  concept_id: string;
  name: string;
  score: number;
  status: "unprobed" | "weak" | "probing" | "resolved" | "strong";
};

export type Diagnosis = {
  session_id: string;
  phase: string;
  concept_scores: ConceptScore[];
  misconception_summary: string | null;
  target_concept_id: string | null;
  target_concept_name: string | null;
  evidence: string | null;
};

export type ProbeQuestion = {
  session_id: string;
  concept_id: string;
  concept_name: string;
  question: string;
  probe_number: number;
};

export type ProbeAnswerResult = {
  session_id: string;
  correct: boolean;
  reasoning: string;
  updated_scores: ConceptScore[];
  ready_for_intervention: boolean;
  misconception_resolved: boolean;
};

export type Intervention = {
  session_id: string;
  concept_id: string;
  concept_name: string;
  intervention_text: string;
};

export type RetestQuestion = {
  session_id: string;
  concept_id: string;
  question: string;
};

export type RetestResult = {
  session_id: string;
  correct: boolean;
  misconception_resolved: boolean;
  reasoning: string;
  before_scores: ConceptScore[];
  after_scores: ConceptScore[];
};
