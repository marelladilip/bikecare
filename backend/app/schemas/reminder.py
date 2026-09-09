from datetime import date, datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict, field_validator


class ReminderBase(BaseModel):
    title: str
    reminder_type: str = "BOTH"  # DATE, ODOMETER, BOTH
    due_date: Optional[date] = None
    due_odometer: Optional[int] = None
    status: str = "DUE_SOON"  # DUE_SOON, DUE_TODAY, OVERDUE, COMPLETED
    notes: Optional[str] = None

    @field_validator("due_odometer")
    @classmethod
    def validate_due_odo(cls, v: Optional[int]) -> Optional[int]:
        if v is not None and v < 0:
            raise ValueError("Due odometer cannot be negative")
        return v


class ReminderCreate(ReminderBase):
    pass


class ReminderUpdate(BaseModel):
    title: Optional[str] = None
    reminder_type: Optional[str] = None
    due_date: Optional[date] = None
    due_odometer: Optional[int] = None
    status: Optional[str] = None
    notes: Optional[str] = None


class ReminderResponse(ReminderBase):
    id: UUID
    bike_id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
