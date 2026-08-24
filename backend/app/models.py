import uuid
from datetime import datetime, timezone

from sqlalchemy import JSON, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


def _uuid() -> str:
    return str(uuid.uuid4())


def _now() -> datetime:
    return datetime.now(timezone.utc)


class StudySession(Base):
    """One MindProbe run through the fixed gradient-descent concept chain."""

    __tablename__ = "sessions"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    topic: Mapped[str] = mapped_column(String, default="gradient_descent")
    # start -> teach -> diagnosis -> probing -> intervention -> retest -> done
    phase: Mapped[str] = mapped_column(String, default="start")
    probe_count: Mapped[int] = mapped_column(Integer, default=0)
    target_concept_id: Mapped[str | None] = mapped_column(String, nullable=True)
    misconception_summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)

    concept_states: Mapped[list["ConceptState"]] = relationship(
        back_populates="session", cascade="all, delete-orphan"
    )
    interactions: Mapped[list["Interaction"]] = relationship(
        back_populates="session", cascade="all, delete-orphan"
    )


class ConceptState(Base):
    """Per-concept, per-session understanding score. Deterministic, LLM-informed."""

    __tablename__ = "concept_states"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    session_id: Mapped[str] = mapped_column(ForeignKey("sessions.id"))
    concept_id: Mapped[str] = mapped_column(String)  # matches concept_graph.py ids
    baseline_score: Mapped[float] = mapped_column(Float, default=0.0)
    current_score: Mapped[float] = mapped_column(Float, default=0.0)

    status: Mapped[str] = mapped_column(String, default="unprobed")
    evidence: Mapped[str | None] = mapped_column(Text, nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=_now, onupdate=_now)

    session: Mapped["StudySession"] = relationship(back_populates="concept_states")


class Interaction(Base):
    """Audit log of every LLM-assessed exchange (teach / probe / retest)."""

    __tablename__ = "interactions"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    session_id: Mapped[str] = mapped_column(ForeignKey("sessions.id"))
    phase: Mapped[str] = mapped_column(String)  # teach | probe | retest
    concept_id: Mapped[str | None] = mapped_column(String, nullable=True)
    prompt: Mapped[str | None] = mapped_column(Text, nullable=True)
    student_response: Mapped[str] = mapped_column(Text)
    llm_assessment: Mapped[dict] = mapped_column(JSON)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)

    session: Mapped["StudySession"] = relationship(back_populates="interactions")
