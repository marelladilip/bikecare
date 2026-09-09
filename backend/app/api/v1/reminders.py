import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import Profile
from app.models.bike import Bike
from app.models.reminder import Reminder
from app.schemas.reminder import ReminderCreate, ReminderUpdate, ReminderResponse

router = APIRouter(tags=["Reminders"])


@router.get("/bikes/{bike_id}/reminders", response_model=List[ReminderResponse])
def get_bike_reminders(
    bike_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: Profile = Depends(get_current_user),
):
    """List all reminders for a bike."""
    bike = db.query(Bike).filter(Bike.id == bike_id, Bike.user_id == current_user.id).first()
    if not bike:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bike not found")

    return db.query(Reminder).filter(Reminder.bike_id == bike_id).order_by(Reminder.due_date.asc()).all()


@router.post("/bikes/{bike_id}/reminders", response_model=ReminderResponse, status_code=status.HTTP_201_CREATED)
def create_reminder(
    bike_id: uuid.UUID,
    rem_in: ReminderCreate,
    db: Session = Depends(get_db),
    current_user: Profile = Depends(get_current_user),
):
    """Create a new service/insurance/PUC reminder."""
    bike = db.query(Bike).filter(Bike.id == bike_id, Bike.user_id == current_user.id).first()
    if not bike:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bike not found")

    new_rem = Reminder(**rem_in.model_dump(), bike_id=bike_id, user_id=current_user.id)
    db.add(new_rem)
    db.commit()
    db.refresh(new_rem)
    return new_rem


@router.patch("/reminders/{reminder_id}/complete", response_model=ReminderResponse)
def complete_reminder(
    reminder_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: Profile = Depends(get_current_user),
):
    """Mark a reminder as completed."""
    rem = db.query(Reminder).filter(Reminder.id == reminder_id, Reminder.user_id == current_user.id).first()
    if not rem:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reminder not found")

    rem.status = "COMPLETED"
    db.commit()
    db.refresh(rem)
    return rem


@router.delete("/reminders/{reminder_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_reminder(
    reminder_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: Profile = Depends(get_current_user),
):
    """Delete a reminder."""
    rem = db.query(Reminder).filter(Reminder.id == reminder_id, Reminder.user_id == current_user.id).first()
    if not rem:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reminder not found")

    db.delete(rem)
    db.commit()
    return None
