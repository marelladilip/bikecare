from fastapi import APIRouter
from app.api.v1.health import router as health_router
from app.api.v1.auth import router as auth_router
from app.api.v1.bikes import router as bikes_router
from app.api.v1.fuel import router as fuel_router
from app.api.v1.maintenance import router as maintenance_router
from app.api.v1.expenses import router as expenses_router
from app.api.v1.reminders import router as reminders_router
from app.api.v1.dashboard import router as dashboard_router

api_router = APIRouter()
api_router.include_router(health_router)
api_router.include_router(auth_router)
api_router.include_router(bikes_router)
api_router.include_router(fuel_router)
api_router.include_router(maintenance_router)
api_router.include_router(expenses_router)
api_router.include_router(reminders_router)
api_router.include_router(dashboard_router)
