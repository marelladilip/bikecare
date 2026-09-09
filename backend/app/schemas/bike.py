from datetime import date, datetime
from decimal import Decimal
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


class BikeBase(BaseModel):
    brand: str
    model: str
    variant: Optional[str] = None
    registration_number: Optional[str] = ""
    purchase_date: Optional[date] = Field(default_factory=date.today)
    purchase_price: Decimal = Decimal("0.00")
    purchase_odometer: int = 0
    current_odometer: int = 0
    fuel_type: str = "PETROL"
    tank_capacity: Decimal = Decimal("12.00")
    expected_mileage: Decimal = Decimal("40.00")
    insurance_expiry: Optional[date] = None
    puc_expiry: Optional[date] = None
    notes: Optional[str] = None
    image_url: Optional[str] = None

    @field_validator("purchase_price")
    @classmethod
    def validate_price(cls, v: Decimal) -> Decimal:
        if v < Decimal("0.00"):
            raise ValueError("Purchase price cannot be negative")
        return v

    @field_validator("purchase_odometer")
    @classmethod
    def validate_purchase_odo(cls, v: int) -> int:
        if v < 0:
            raise ValueError("Purchase odometer reading cannot be negative")
        return v

    @field_validator("tank_capacity", "expected_mileage")
    @classmethod
    def validate_positive_decimal(cls, v: Decimal) -> Decimal:
        if v <= Decimal("0.00"):
            raise ValueError("Value must be greater than zero")
        return v

    @model_validator(mode="after")
    def validate_current_odometer(self):
        if self.current_odometer < self.purchase_odometer:
            raise ValueError(
                f"Current odometer ({self.current_odometer}) cannot be lower than purchase odometer ({self.purchase_odometer})"
            )
        return self


class BikeCreate(BikeBase):
    pass


class BikeUpdate(BaseModel):
    brand: Optional[str] = None
    model: Optional[str] = None
    variant: Optional[str] = None
    registration_number: Optional[str] = None
    purchase_date: Optional[date] = None
    purchase_price: Optional[Decimal] = None
    purchase_odometer: Optional[int] = None
    current_odometer: Optional[int] = None
    fuel_type: Optional[str] = None
    tank_capacity: Optional[Decimal] = None
    expected_mileage: Optional[Decimal] = None
    insurance_expiry: Optional[date] = None
    puc_expiry: Optional[date] = None
    notes: Optional[str] = None
    image_url: Optional[str] = None


class BikeResponse(BikeBase):
    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
