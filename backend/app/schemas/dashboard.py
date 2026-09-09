from datetime import date
from decimal import Decimal
from typing import List, Optional
from uuid import UUID
from pydantic import BaseModel


class KPICards(BaseModel):
    total_expenses: Decimal = Decimal("0.00")
    fuel_expenses: Decimal = Decimal("0.00")
    maintenance_expenses: Decimal = Decimal("0.00")
    repair_expenses: Decimal = Decimal("0.00")
    total_distance: int = 0
    current_odometer: int = 0
    average_mileage: Optional[Decimal] = None
    cost_per_km: Optional[Decimal] = None


class RecentActivityItem(BaseModel):
    id: UUID
    type: str  # FUEL, MAINTENANCE, EXPENSE, REMINDER
    title: str
    date: date
    amount: Optional[Decimal] = None
    odometer: Optional[int] = None
    status: Optional[str] = None


class MonthlyExpensePoint(BaseModel):
    month: str  # "Jan 2024"
    fuel: Decimal = Decimal("0.00")
    maintenance: Decimal = Decimal("0.00")
    other: Decimal = Decimal("0.00")
    total: Decimal = Decimal("0.00")


class MileageTrendPoint(BaseModel):
    date: date
    odometer: int
    mileage: Optional[Decimal] = None
    petrol_price: Decimal


class TCOResponse(BaseModel):
    bike_id: UUID
    bike_name: str
    purchase_price: Decimal
    fuel_expenses: Decimal
    maintenance_expenses: Decimal
    repair_expenses: Decimal
    insurance_expenses: Decimal
    accessories_expenses: Decimal
    other_expenses: Decimal
    total_ownership_cost: Decimal
    total_distance_km: int
    total_cost_per_km: Optional[Decimal] = None
    maintenance_cost_per_km: Optional[Decimal] = None
    fuel_cost_per_km: Optional[Decimal] = None


class DashboardResponse(BaseModel):
    bike_id: UUID
    kpis: KPICards
    recent_activity: List[RecentActivityItem] = []
    upcoming_reminders: List[dict] = []
