import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Numeric, Date, Boolean, Text, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base


class Expense(Base):
    __tablename__ = "expenses"

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
    date = Column(Date, nullable=False)
    category = Column(String, nullable=False)
    amount = Column(Numeric(10, 2), nullable=False)
    description = Column(Text, nullable=True)
    payment_method = Column(String, nullable=False, default="UPI")
    receipt_url = Column(String, nullable=True)
    is_synced_from_module = Column(Boolean, nullable=False, default=False)
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
    bike = relationship("Bike", back_populates="expenses")
    user = relationship("Profile", back_populates="expenses")
