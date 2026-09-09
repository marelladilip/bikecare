from datetime import date, datetime
from decimal import Decimal
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict, field_validator, model_validator


class FuelBase(BaseModel):
    date: date
    odometer: int
    litres: Decimal
    price_per_litre: Decimal
    total_amount: Optional[Decimal] = None
    petrol_station: Optional[str] = None
    is_full_tank: bool = True
    notes: Optional[str] = None
    receipt_url: Optional[str] = None

    @field_validator("odometer")
    @classmethod
    def validate_odometer(cls, v: int) -> int:
        if v < 0:
            raise ValueError("Odometer reading cannot be negative")
        return v

    @field_validator("litres", "price_per_litre")
    @classmethod
    def validate_positive(cls, v: Decimal) -> Decimal:
        if v <= Decimal("0.00"):
            raise ValueError("Must be strictly greater than 0")
        return v

    @model_validator(mode="after")
    def auto_calculate_total(self):
        # Auto-compute total_amount if not provided or 0
        if self.total_amount is None or self.total_amount <= Decimal("0.00"):
            self.total_amount = round(self.litres * self.price_per_litre, 2)
        return self


class FuelCreate(FuelBase):
    pass


class FuelUpdate(BaseModel):
    date: Optional[date] = None
    odometer: Optional[int] = None
    litres: Optional[Decimal] = None
    price_per_litre: Optional[Decimal] = None
    total_amount: Optional[Decimal] = None
    petrol_station: Optional[str] = None
    is_full_tank: Optional[bool] = None
    notes: Optional[str] = None
    receipt_url: Optional[str] = None


class FuelResponse(FuelBase):
    id: UUID
    bike_id: UUID
    user_id: UUID
    distance_travelled: Optional[int] = None
    mileage: Optional[Decimal] = None
    fuel_cost_per_km: Optional[Decimal] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class FuelAnalytics(BaseModel):
    average_mileage: Optional[Decimal] = None
    best_mileage: Optional[Decimal] = None
    worst_mileage: Optional[Decimal] = None
    average_price: Optional[Decimal] = None
    total_litres: Decimal = Decimal("0.00")
    total_fuel_spent: Decimal = Decimal("0.00")
    total_distance_recorded: int = 0
    average_fuel_cost_per_km: Optional[Decimal] = None
    entries_count: int = 0
