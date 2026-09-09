import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Numeric, Date, Boolean, Text, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base


class FuelRecord(Base):
    __tablename__ = "fuel_records"

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
    odometer = Column(Integer, nullable=False)
    litres = Column(Numeric(7, 2), nullable=False)
    price_per_litre = Column(Numeric(7, 2), nullable=False)
    total_amount = Column(Numeric(10, 2), nullable=False)
    petrol_station = Column(String, nullable=True)
    is_full_tank = Column(Boolean, nullable=False, default=True)
    notes = Column(Text, nullable=True)
    receipt_url = Column(String, nullable=True)
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
    bike = relationship("Bike", back_populates="fuel_records")
    user = relationship("Profile", back_populates="fuel_records")
