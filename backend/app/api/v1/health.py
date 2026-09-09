from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.core.database import get_db

router = APIRouter()


@router.get("/health", tags=["System"])
def health_check(db: Session = Depends(get_db)):
    """Health check endpoint to verify API and database connectivity."""
    db_status = "healthy"
    try:
        db.execute(text("SELECT 1"))
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"

    return {
        "status": "online",
        "service": "BikeCare API",
        "database": db_status,
        "version": "1.0.0",
    }
