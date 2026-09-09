import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Date, Text, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base


class Reminder(Base):
    __tablename__ = "reminders"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        index=True,
    )
    bike_id = Column(
        UUID(as_uuid=True),
        ForeignKey("bikes.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("profiles.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    title = Column(String, nullable=False)
    reminder_type = Column(String, nullable=False, default="BOTH")
    due_date = Column(Date, nullable=True)
    due_odometer = Column(Integer, nullable=True)
    status = Column(String, nullable=False, default="DUE_SOON")
    notes = Column(Text, nullable=True)
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    bike = relationship("Bike", back_populates="reminders")
    user = relationship("Profile", back_populates="reminders")
