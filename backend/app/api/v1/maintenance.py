import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import Profile
from app.models.bike import Bike
from app.models.maintenance import MaintenanceCategory, MaintenanceRecord
from app.schemas.maintenance import (
    MaintenanceCategoryCreate,
    MaintenanceCategoryResponse,
    MaintenanceCreate,
    MaintenanceUpdate,
    MaintenanceResponse,
)

router = APIRouter(tags=["Maintenance"])


@router.get("/maintenance/categories", response_model=List[MaintenanceCategoryResponse])
def get_categories(
    db: Session = Depends(get_db),
    current_user: Profile = Depends(get_current_user),
):
    """List all system and user custom maintenance categories."""
    return (
        db.query(MaintenanceCategory)
        .filter((MaintenanceCategory.is_system == True) | (MaintenanceCategory.user_id == current_user.id))
        .order_by(MaintenanceCategory.name.asc())
        .all()
    )


@router.post("/maintenance/categories", response_model=MaintenanceCategoryResponse, status_code=status.HTTP_201_CREATED)
def create_custom_category(
    category_in: MaintenanceCategoryCreate,
    db: Session = Depends(get_db),
    current_user: Profile = Depends(get_current_user),
):
    """Create a custom maintenance category."""
    cat = MaintenanceCategory(
        name=category_in.name,
        user_id=current_user.id,
        is_system=False,
    )
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return cat


@router.get("/bikes/{bike_id}/maintenance", response_model=List[MaintenanceResponse])
def get_bike_maintenance(
    bike_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: Profile = Depends(get_current_user),
):
    """List all maintenance records for a bike."""
    bike = db.query(Bike).filter(Bike.id == bike_id, Bike.user_id == current_user.id).first()
    if not bike:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bike not found")

    records = db.query(MaintenanceRecord).filter(MaintenanceRecord.bike_id == bike_id).order_by(MaintenanceRecord.date.desc()).all()
    out = []
    for r in records:
        data = {
            "id": r.id,
            "bike_id": r.bike_id,
            "user_id": r.user_id,
            "category_id": r.category_id,
            "category_name": r.category.name if r.category else "General Service",
            "date": r.date,
            "odometer": r.odometer,
            "cost": r.cost,
            "service_center": r.service_center,
            "parts_replaced": r.parts_replaced,
            "description": r.description,
            "next_due_date": r.next_due_date,
            "next_due_odometer": r.next_due_odometer,
            "receipt_url": r.receipt_url,
            "notes": r.notes,
            "created_at": r.created_at,
            "updated_at": r.updated_at,
        }
        out.append(data)
    return out


@router.post("/bikes/{bike_id}/maintenance", response_model=MaintenanceResponse, status_code=status.HTTP_201_CREATED)
def add_maintenance_record(
    bike_id: uuid.UUID,
    record_in: MaintenanceCreate,
    db: Session = Depends(get_db),
    current_user: Profile = Depends(get_current_user),
):
    """Add a new maintenance record and sync odometer."""
    bike = db.query(Bike).filter(Bike.id == bike_id, Bike.user_id == current_user.id).first()
    if not bike:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bike not found")

    rec_data = record_in.model_dump()
    new_record = MaintenanceRecord(**rec_data, bike_id=bike_id, user_id=current_user.id)
    db.add(new_record)

    if record_in.odometer > bike.current_odometer:
        bike.current_odometer = record_in.odometer

    db.commit()
    db.refresh(new_record)

    return {
        **new_record.__dict__,
        "category_name": new_record.category.name if new_record.category else "General Service",
    }


@router.delete("/maintenance/{record_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_maintenance_record(
    record_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: Profile = Depends(get_current_user),
):
    """Delete a maintenance record."""
    record = db.query(MaintenanceRecord).filter(MaintenanceRecord.id == record_id, MaintenanceRecord.user_id == current_user.id).first()
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Maintenance record not found")

    db.delete(record)
    db.commit()
    return None
