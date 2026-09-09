from datetime import date, datetime
from decimal import Decimal
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict, field_validator, model_validator


class MaintenanceCategoryBase(BaseModel):
    name: str


class MaintenanceCategoryCreate(MaintenanceCategoryBase):
    pass


class MaintenanceCategoryResponse(MaintenanceCategoryBase):
    id: UUID
    user_id: Optional[UUID] = None
    is_system: bool = False
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class MaintenanceBase(BaseModel):
    category_id: UUID
    date: date
    odometer: int
    cost: Decimal = Decimal("0.00")
    service_center: Optional[str] = None
    parts_replaced: Optional[str] = None
    description: Optional[str] = None
    next_due_date: Optional[date] = None
    next_due_odometer: Optional[int] = None
    receipt_url: Optional[str] = None
    notes: Optional[str] = None

    @field_validator("odometer")
    @classmethod
    def validate_odo(cls, v: int) -> int:
        if v < 0:
            raise ValueError("Odometer reading cannot be negative")
        return v

    @field_validator("cost")
    @classmethod
    def validate_cost(cls, v: Decimal) -> Decimal:
        if v < Decimal("0.00"):
            raise ValueError("Cost cannot be negative")
        return v

    @model_validator(mode="after")
    def validate_next_due(self):
        if self.next_due_odometer is not None and self.next_due_odometer < self.odometer:
            raise ValueError(
                f"Next due odometer ({self.next_due_odometer}) cannot be less than current service odometer ({self.odometer})"
            )
        if self.next_due_date is not None and self.next_due_date < self.date:
            raise ValueError(
                f"Next due date ({self.next_due_date}) cannot be earlier than service date ({self.date})"
            )
        return self


class MaintenanceCreate(MaintenanceBase):
    pass


class MaintenanceUpdate(BaseModel):
    category_id: Optional[UUID] = None
    date: Optional[date] = None
    odometer: Optional[int] = None
    cost: Optional[Decimal] = None
    service_center: Optional[str] = None
    parts_replaced: Optional[str] = None
    description: Optional[str] = None
    next_due_date: Optional[date] = None
    next_due_odometer: Optional[int] = None
    receipt_url: Optional[str] = None
    notes: Optional[str] = None


class MaintenanceResponse(MaintenanceBase):
    id: UUID
    bike_id: UUID
    user_id: UUID
    category_name: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
