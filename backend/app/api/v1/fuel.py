import uuid
from decimal import Decimal
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import Profile
from app.models.bike import Bike
from app.models.fuel import FuelRecord
from app.schemas.fuel import FuelCreate, FuelUpdate, FuelResponse, FuelAnalytics

router = APIRouter(tags=["Fuel"])


def compute_fuel_metrics(records: List[FuelRecord]) -> List[dict]:
    """Sort fuel records chronologically and compute distance_travelled and mileage."""
    sorted_records = sorted(records, key=lambda r: (r.date, r.odometer))
    results = []

    for i, r in enumerate(sorted_records):
        dist = None
        mileage = None
        cost_per_km = None

        if i > 0:
            prev = sorted_records[i - 1]
            dist = r.odometer - prev.odometer
            if dist > 0 and r.litres > Decimal("0.00"):
                mileage = round(Decimal(dist) / r.litres, 2)
                if r.total_amount:
                    cost_per_km = round(r.total_amount / Decimal(dist), 2)

        data = {
            "id": r.id,
            "bike_id": r.bike_id,
            "user_id": r.user_id,
            "date": r.date,
            "odometer": r.odometer,
            "litres": r.litres,
            "price_per_litre": r.price_per_litre,
            "total_amount": r.total_amount,
            "petrol_station": r.petrol_station,
            "is_full_tank": r.is_full_tank,
            "notes": r.notes,
            "receipt_url": r.receipt_url,
            "distance_travelled": dist,
            "mileage": mileage,
            "fuel_cost_per_km": cost_per_km,
            "created_at": r.created_at,
            "updated_at": r.updated_at,
        }
        results.append(data)

    # Return newest first for standard list view
    results.reverse()
    return results


@router.get("/bikes/{bike_id}/fuel", response_model=List[FuelResponse])
def get_bike_fuel_records(
    bike_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: Profile = Depends(get_current_user),
):
    """List all fuel records for a bike with calculated mileage."""
    bike = db.query(Bike).filter(Bike.id == bike_id, Bike.user_id == current_user.id).first()
    if not bike:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bike not found")

    records = db.query(FuelRecord).filter(FuelRecord.bike_id == bike_id).all()
    return compute_fuel_metrics(records)


@router.post("/bikes/{bike_id}/fuel", response_model=FuelResponse, status_code=status.HTTP_201_CREATED)
def add_fuel_record(
    bike_id: uuid.UUID,
    fuel_in: FuelCreate,
    db: Session = Depends(get_db),
    current_user: Profile = Depends(get_current_user),
):
    """Add a new fuel fill-up record and auto-update bike odometer."""
    bike = db.query(Bike).filter(Bike.id == bike_id, Bike.user_id == current_user.id).first()
    if not bike:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bike not found")

    fuel_data = fuel_in.model_dump()
    new_record = FuelRecord(**fuel_data, bike_id=bike_id, user_id=current_user.id)
    db.add(new_record)

    # Sync bike odometer if new fill-up reading is higher
    if fuel_in.odometer > bike.current_odometer:
        bike.current_odometer = fuel_in.odometer

    db.commit()
    db.refresh(new_record)

    all_records = db.query(FuelRecord).filter(FuelRecord.bike_id == bike_id).all()
    computed = compute_fuel_metrics(all_records)
    for c in computed:
        if c["id"] == new_record.id:
            return c
    return new_record


@router.get("/bikes/{bike_id}/fuel/analytics", response_model=FuelAnalytics)
def get_fuel_analytics(
    bike_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: Profile = Depends(get_current_user),
):
    """Compute fuel stats and mileage analytics for a bike."""
    bike = db.query(Bike).filter(Bike.id == bike_id, Bike.user_id == current_user.id).first()
    if not bike:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bike not found")

    records = db.query(FuelRecord).filter(FuelRecord.bike_id == bike_id).all()
    if not records:
        return FuelAnalytics()

    computed = compute_fuel_metrics(records)
    mileages = [c["mileage"] for c in computed if c["mileage"] is not None]
    total_litres = sum(r.litres for r in records)
    total_spent = sum(r.total_amount for r in records if r.total_amount)
    avg_price = round(sum(r.price_per_litre for r in records) / len(records), 2) if records else None

    avg_mileage = round(sum(mileages) / len(mileages), 2) if mileages else None
    best_mileage = max(mileages) if mileages else None
    worst_mileage = min(mileages) if mileages else None

    total_dist = sum(c["distance_travelled"] for c in computed if c["distance_travelled"] is not None)
    avg_cost_km = round(total_spent / Decimal(total_dist), 2) if total_dist > 0 else None

    return FuelAnalytics(
        average_mileage=avg_mileage,
        best_mileage=best_mileage,
        worst_mileage=worst_mileage,
        average_price=avg_price,
        total_litres=total_litres,
        total_fuel_spent=total_spent,
        total_distance_recorded=total_dist,
        average_fuel_cost_per_km=avg_cost_km,
        entries_count=len(records),
    )


@router.put("/fuel/{record_id}", response_model=FuelResponse)
def update_fuel_record(
    record_id: uuid.UUID,
    fuel_in: FuelUpdate,
    db: Session = Depends(get_db),
    current_user: Profile = Depends(get_current_user),
):
    """Update an existing fuel record."""
    record = db.query(FuelRecord).filter(FuelRecord.id == record_id, FuelRecord.user_id == current_user.id).first()
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Fuel record not found")

    update_data = fuel_in.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        setattr(record, field, val)

    # Recalculate total if litres or price updated
    if "litres" in update_data or "price_per_litre" in update_data:
        if "total_amount" not in update_data or update_data["total_amount"] is None:
            record.total_amount = round(record.litres * record.price_per_litre, 2)

    db.commit()
    db.refresh(record)

    all_records = db.query(FuelRecord).filter(FuelRecord.bike_id == record.bike_id).all()
    computed = compute_fuel_metrics(all_records)
    for c in computed:
        if c["id"] == record.id:
            return c
    return record


@router.delete("/fuel/{record_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_fuel_record(
    record_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: Profile = Depends(get_current_user),
):
    """Delete a fuel record."""
    record = db.query(FuelRecord).filter(FuelRecord.id == record_id, FuelRecord.user_id == current_user.id).first()
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Fuel record not found")

    db.delete(record)
    db.commit()
    return None
