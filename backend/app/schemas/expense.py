from datetime import date, datetime
from decimal import Decimal
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict, field_validator


class ExpenseBase(BaseModel):
    date: date
    category: str
    amount: Decimal
    description: Optional[str] = None
    payment_method: str = "UPI"
    receipt_url: Optional[str] = None
    is_synced_from_module: bool = False

    @field_validator("amount")
    @classmethod
    def validate_amount(cls, v: Decimal) -> Decimal:
        if v < Decimal("0.00"):
            raise ValueError("Expense amount cannot be negative")
        return v


class ExpenseCreate(ExpenseBase):
    pass


class ExpenseUpdate(BaseModel):
    date: Optional[date] = None
    category: Optional[str] = None
    amount: Optional[Decimal] = None
    description: Optional[str] = None
    payment_method: Optional[str] = None
    receipt_url: Optional[str] = None


class ExpenseResponse(ExpenseBase):
    id: UUID
    bike_id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ExpenseCategorySummary(BaseModel):
    category: str
    total_amount: Decimal
    percentage: Decimal
