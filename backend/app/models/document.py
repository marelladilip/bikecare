import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Date, Text, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base


class Document(Base):
    __tablename__ = "documents"

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
    doc_type = Column(String, nullable=False, default="OTHER")
    file_name = Column(String, nullable=False)
    file_url = Column(String, nullable=False)
    mime_type = Column(String, nullable=True)
    file_size_bytes = Column(Integer, nullable=True)
    expiry_date = Column(Date, nullable=True)
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
    bike = relationship("Bike", back_populates="documents")
    user = relationship("Profile", back_populates="documents")
