import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import Profile
from app.models.bike import Bike
from app.schemas.bike import BikeCreate, BikeUpdate, BikeResponse

router = APIRouter(prefix="/bikes", tags=["Bikes"])


@router.get("", response_model=List[BikeResponse])
def get_user_bikes(
    db: Session = Depends(get_db),
    current_user: Profile = Depends(get_current_user),
):
    """Retrieve all bikes belonging to the authenticated user."""
    return db.query(Bike).filter(Bike.user_id == current_user.id).order_by(Bike.created_at.desc()).all()


@router.post("", response_model=BikeResponse, status_code=status.HTTP_201_CREATED)
def create_bike(
    bike_in: BikeCreate,
    db: Session = Depends(get_db),
    current_user: Profile = Depends(get_current_user),
):
    """Register a new bike in the user's garage."""
    bike_data = bike_in.model_dump()
    new_bike = Bike(**bike_data, user_id=current_user.id)
    db.add(new_bike)
    db.commit()
    db.refresh(new_bike)
    return new_bike


@router.get("/{bike_id}", response_model=BikeResponse)
def get_bike_by_id(
    bike_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: Profile = Depends(get_current_user),
):
    """Get details of a specific bike."""
    bike = db.query(Bike).filter(Bike.id == bike_id, Bike.user_id == current_user.id).first()
    if not bike:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bike not found")
    return bike


@router.put("/{bike_id}", response_model=BikeResponse)
def update_bike(
    bike_id: uuid.UUID,
    bike_in: BikeUpdate,
    db: Session = Depends(get_db),
    current_user: Profile = Depends(get_current_user),
):
    """Update bike details."""
    bike = db.query(Bike).filter(Bike.id == bike_id, Bike.user_id == current_user.id).first()
    if not bike:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bike not found")

    update_data = bike_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(bike, field, value)

    db.commit()
    db.refresh(bike)
    return bike


@router.delete("/{bike_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_bike(
    bike_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: Profile = Depends(get_current_user),
):
    """Delete a bike and all associated records."""
    bike = db.query(Bike).filter(Bike.id == bike_id, Bike.user_id == current_user.id).first()
    if not bike:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bike not found")

    db.delete(bike)
    db.commit()
    return None
