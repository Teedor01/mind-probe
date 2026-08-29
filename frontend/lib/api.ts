import type {
  Diagnosis,
  Intervention,
  Lesson,
  ProbeAnswerResult,
  ProbeQuestion,
  RetestQuestion,
  RetestResult,
} from "./types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options?.headers ?? {}) },
  });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`${res.status} ${res.statusText}: ${detail}`);
  }
  return res.json();
}

export const api = {
  createSession: () => request<Diagnosis>("/api/sessions", { method: "POST" }),

  lesson: (sessionId: string) =>
    request<Lesson>(`/api/sessions/${sessionId}/lesson`, { method: "POST" }),

  teach: (sessionId: string, explanation: string) =>
    request<Diagnosis>(`/api/sessions/${sessionId}/teach`, {
      method: "POST",
      body: JSON.stringify({ explanation }),
    }),

  getDiagnosis: (sessionId: string) =>
    request<Diagnosis>(`/api/sessions/${sessionId}/diagnosis`),

  probe: (sessionId: string) =>
    request<ProbeQuestion>(`/api/sessions/${sessionId}/probe`, { method: "POST" }),

  probeAnswer: (sessionId: string, conceptId: string, answer: string) =>
    request<ProbeAnswerResult>(`/api/sessions/${sessionId}/probe/answer`, {
      method: "POST",
      body: JSON.stringify({ concept_id: conceptId, answer }),
    }),

  intervention: (sessionId: string) =>
    request<Intervention>(`/api/sessions/${sessionId}/intervention`, { method: "POST" }),

  retest: (sessionId: string) =>
    request<RetestQuestion>(`/api/sessions/${sessionId}/retest`, { method: "POST" }),

  retestAnswer: (sessionId: string, answer: string) =>
    request<RetestResult>(`/api/sessions/${sessionId}/retest/answer`, {
      method: "POST",
      body: JSON.stringify({ answer }),
    }),
};
