from app.schemas.user import (
    UserRegister,
    UserLogin,
    Token,
    TokenPayload,
    ProfileResponse,
    ProfileUpdate,
)
from app.schemas.bike import BikeCreate, BikeUpdate, BikeResponse
from app.schemas.fuel import FuelCreate, FuelUpdate, FuelResponse, FuelAnalytics
from app.schemas.maintenance import (
    MaintenanceCategoryCreate,
    MaintenanceCategoryResponse,
    MaintenanceCreate,
    MaintenanceUpdate,
    MaintenanceResponse,
)
from app.schemas.expense import (
    ExpenseCreate,
    ExpenseUpdate,
    ExpenseResponse,
    ExpenseCategorySummary,
)
from app.schemas.reminder import (
    ReminderCreate,
    ReminderUpdate,
    ReminderResponse,
)
from app.schemas.dashboard import (
    KPICards,
    DashboardResponse,
    TCOResponse,
    MonthlyExpensePoint,
    MileageTrendPoint,
)

__all__ = [
    "UserRegister",
    "UserLogin",
    "Token",
    "TokenPayload",
    "ProfileResponse",
    "ProfileUpdate",
    "BikeCreate",
    "BikeUpdate",
    "BikeResponse",
    "FuelCreate",
    "FuelUpdate",
    "FuelResponse",
    "FuelAnalytics",
    "MaintenanceCategoryCreate",
    "MaintenanceCategoryResponse",
    "MaintenanceCreate",
    "MaintenanceUpdate",
    "MaintenanceResponse",
    "ExpenseCreate",
    "ExpenseUpdate",
    "ExpenseResponse",
    "ExpenseCategorySummary",
    "ReminderCreate",
    "ReminderUpdate",
    "ReminderResponse",
    "KPICards",
    "DashboardResponse",
    "TCOResponse",
    "MonthlyExpensePoint",
    "MileageTrendPoint",
]
