import uuid
from decimal import Decimal
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import Profile
from app.models.bike import Bike
from app.models.fuel import FuelRecord
from app.models.maintenance import MaintenanceRecord
from app.models.expense import Expense
from app.models.reminder import Reminder
from app.schemas.dashboard import (
    KPICards,
    RecentActivityItem,
    TCOResponse,
    DashboardResponse,
    MonthlyExpensePoint,
    MileageTrendPoint,
)

router = APIRouter(tags=["Dashboard & Analytics"])


@router.get("/dashboard/{bike_id}", response_model=DashboardResponse)
def get_dashboard_summary(
    bike_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: Profile = Depends(get_current_user),
):
    """Aggregate dashboard metrics, KPIs, and recent activity for a bike."""
    bike = db.query(Bike).filter(Bike.id == bike_id, Bike.user_id == current_user.id).first()
    if not bike:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bike not found")

    fuels = db.query(FuelRecord).filter(FuelRecord.bike_id == bike_id).all()
    maints = db.query(MaintenanceRecord).filter(MaintenanceRecord.bike_id == bike_id).all()
    expenses = db.query(Expense).filter(Expense.bike_id == bike_id).all()
    reminders = db.query(Reminder).filter(Reminder.bike_id == bike_id).all()

    fuel_cost = sum((r.total_amount for r in fuels if r.total_amount), Decimal("0.00"))
    maint_cost = sum((r.cost for r in maints if r.cost), Decimal("0.00"))
    other_cost = sum((r.amount for r in expenses if r.amount), Decimal("0.00"))
    total_expenses = fuel_cost + maint_cost + other_cost

    total_dist = max(0, bike.current_odometer - bike.purchase_odometer)
    cost_per_km = round(total_expenses / Decimal(total_dist), 2) if total_dist > 0 else None

    # Calculate average mileage
    total_litres = sum((r.litres for r in fuels if r.litres), Decimal("0.00"))
    avg_mileage = round(Decimal(total_dist) / total_litres, 2) if total_litres > Decimal("0.00") and total_dist > 0 else None

    kpis = KPICards(
        total_expenses=total_expenses,
        fuel_expenses=fuel_cost,
        maintenance_expenses=maint_cost,
        repair_expenses=Decimal("0.00"),
        total_distance=total_dist,
        current_odometer=bike.current_odometer,
        average_mileage=avg_mileage,
        cost_per_km=cost_per_km,
    )

    # Compile recent activity
    activities = []
    for f in fuels[-5:]:
        activities.append(RecentActivityItem(
            id=f.id,
            type="FUEL",
            title=f"Fuel Refill ({f.litres} L)",
            date=f.date,
            amount=f.total_amount,
            odometer=f.odometer,
            status="COMPLETED",
        ))
    for m in maints[-5:]:
        activities.append(RecentActivityItem(
            id=m.id,
            type="MAINTENANCE",
            title=m.category.name if m.category else "Service",
            date=m.date,
            amount=m.cost,
            odometer=m.odometer,
            status="COMPLETED",
        ))
    for e in expenses[-5:]:
        activities.append(RecentActivityItem(
            id=e.id,
            type="EXPENSE",
            title=f"{e.category} - {e.description or 'Expense'}",
            date=e.date,
            amount=e.amount,
            status="COMPLETED",
        ))

    activities.sort(key=lambda a: a.date, reverse=True)

    # Upcoming reminders
    rem_list = [
        {
            "id": str(r.id),
            "title": r.title,
            "due_date": str(r.due_date) if r.due_date else None,
            "due_odometer": r.due_odometer,
            "status": r.status,
        }
        for r in reminders if r.status != "COMPLETED"
    ]

    return DashboardResponse(
        bike_id=bike.id,
        kpis=kpis,
        recent_activity=activities[:10],
        upcoming_reminders=rem_list,
    )


@router.get("/tco/{bike_id}", response_model=TCOResponse)
def get_total_cost_of_ownership(
    bike_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: Profile = Depends(get_current_user),
):
    """Calculate comprehensive Total Cost of Ownership (TCO)."""
    bike = db.query(Bike).filter(Bike.id == bike_id, Bike.user_id == current_user.id).first()
    if not bike:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bike not found")

    fuels = db.query(FuelRecord).filter(FuelRecord.bike_id == bike_id).all()
    maints = db.query(MaintenanceRecord).filter(MaintenanceRecord.bike_id == bike_id).all()
    expenses = db.query(Expense).filter(Expense.bike_id == bike_id).all()

    fuel_cost = sum((r.total_amount for r in fuels if r.total_amount), Decimal("0.00"))
    maint_cost = sum((r.cost for r in maints if r.cost), Decimal("0.00"))

    insurance_cost = sum((e.amount for e in expenses if e.category.upper() == "INSURANCE"), Decimal("0.00"))
    acc_cost = sum((e.amount for e in expenses if e.category.upper() == "ACCESSORIES"), Decimal("0.00"))
    other_cost = sum((e.amount for e in expenses if e.category.upper() not in ["INSURANCE", "ACCESSORIES"]), Decimal("0.00"))

    total_tco = bike.purchase_price + fuel_cost + maint_cost + insurance_cost + acc_cost + other_cost
    total_dist = max(0, bike.current_odometer - bike.purchase_odometer)

    tco_per_km = round(total_tco / Decimal(total_dist), 2) if total_dist > 0 else None
    maint_per_km = round(maint_cost / Decimal(total_dist), 2) if total_dist > 0 else None
    fuel_per_km = round(fuel_cost / Decimal(total_dist), 2) if total_dist > 0 else None

    return TCOResponse(
        bike_id=bike.id,
        bike_name=f"{bike.brand} {bike.model}",
        purchase_price=bike.purchase_price,
        fuel_expenses=fuel_cost,
        maintenance_expenses=maint_cost,
        repair_expenses=Decimal("0.00"),
        insurance_expenses=insurance_cost,
        accessories_expenses=acc_cost,
        other_expenses=other_cost,
        total_ownership_cost=total_tco,
        total_distance_km=total_dist,
        total_cost_per_km=tco_per_km,
        maintenance_cost_per_km=maint_per_km,
        fuel_cost_per_km=fuel_per_km,
    )
