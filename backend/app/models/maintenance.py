import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Numeric, Date, Boolean, Text, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base


class MaintenanceCategory(Base):
    __tablename__ = "maintenance_categories"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        index=True,
    )
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("profiles.id", ondelete="CASCADE"),
        nullable=True,  # NULL for system default presets
        index=True,
    )
    name = Column(String, nullable=False)
    is_system = Column(Boolean, nullable=False, default=False)
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    records = relationship("MaintenanceRecord", back_populates="category")


class MaintenanceRecord(Base):
    __tablename__ = "maintenance_records"

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
    category_id = Column(
        UUID(as_uuid=True),
        ForeignKey("maintenance_categories.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    date = Column(Date, nullable=False)
    odometer = Column(Integer, nullable=False)
    cost = Column(Numeric(10, 2), nullable=False, default=0.00)
    service_center = Column(String, nullable=True)
    parts_replaced = Column(String, nullable=True)
    description = Column(Text, nullable=True)
    next_due_date = Column(Date, nullable=True)
    next_due_odometer = Column(Integer, nullable=True)
    receipt_url = Column(String, nullable=True)
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
    bike = relationship("Bike", back_populates="maintenance_records")
    user = relationship("Profile", back_populates="maintenance_records")
    category = relationship("MaintenanceCategory", back_populates="records")
