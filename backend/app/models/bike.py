import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Numeric, Date, Text, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base


class Bike(Base):
    __tablename__ = "bikes"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        index=True,
    )
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("profiles.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    brand = Column(String, nullable=False)
    model = Column(String, nullable=False)
    variant = Column(String, nullable=True)
    vehicle_type = Column(String, nullable=False, default="BIKE")
    registration_number = Column(String, nullable=False)
    purchase_date = Column(Date, nullable=False)
    purchase_price = Column(Numeric(12, 2), nullable=False, default=0.00)
    purchase_odometer = Column(Integer, nullable=False, default=0)
    current_odometer = Column(Integer, nullable=False, default=0)
    fuel_type = Column(String, nullable=False, default="PETROL")
    tank_capacity = Column(Numeric(5, 2), nullable=False, default=12.00)
    expected_mileage = Column(Numeric(5, 2), nullable=False, default=40.00)
    insurance_expiry = Column(Date, nullable=True)
    puc_expiry = Column(Date, nullable=True)
    notes = Column(Text, nullable=True)
    image_url = Column(String, nullable=True)
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
    owner = relationship("Profile", back_populates="bikes")
    fuel_records = relationship("FuelRecord", back_populates="bike", cascade="all, delete-orphan")
    maintenance_records = relationship("MaintenanceRecord", back_populates="bike", cascade="all, delete-orphan")
    expenses = relationship("Expense", back_populates="bike", cascade="all, delete-orphan")
    reminders = relationship("Reminder", back_populates="bike", cascade="all, delete-orphan")
    documents = relationship("Document", back_populates="bike", cascade="all, delete-orphan")
