import uuid
from decimal import Decimal
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import Profile
from app.models.bike import Bike
from app.models.expense import Expense
from app.schemas.expense import ExpenseCreate, ExpenseUpdate, ExpenseResponse, ExpenseCategorySummary

router = APIRouter(tags=["Expenses"])


@router.get("/bikes/{bike_id}/expenses", response_model=List[ExpenseResponse])
def get_bike_expenses(
    bike_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: Profile = Depends(get_current_user),
):
    """List all general expenses for a bike."""
    bike = db.query(Bike).filter(Bike.id == bike_id, Bike.user_id == current_user.id).first()
    if not bike:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bike not found")

    return db.query(Expense).filter(Expense.bike_id == bike_id).order_by(Expense.date.desc()).all()


@router.post("/bikes/{bike_id}/expenses", response_model=ExpenseResponse, status_code=status.HTTP_201_CREATED)
def add_expense(
    bike_id: uuid.UUID,
    expense_in: ExpenseCreate,
    db: Session = Depends(get_db),
    current_user: Profile = Depends(get_current_user),
):
    """Create a new expense entry."""
    bike = db.query(Bike).filter(Bike.id == bike_id, Bike.user_id == current_user.id).first()
    if not bike:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bike not found")

    new_exp = Expense(**expense_in.model_dump(), bike_id=bike_id, user_id=current_user.id)
    db.add(new_exp)
    db.commit()
    db.refresh(new_exp)
    return new_exp


@router.delete("/expenses/{expense_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_expense(
    expense_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: Profile = Depends(get_current_user),
):
    """Delete an expense record."""
    exp = db.query(Expense).filter(Expense.id == expense_id, Expense.user_id == current_user.id).first()
    if not exp:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Expense not found")

    db.delete(exp)
    db.commit()
    return None
