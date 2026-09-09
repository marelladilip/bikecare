from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import Base, engine
from app.api.v1 import api_router

# Initialize FastAPI application
app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    description="Production-quality REST API for BikeCare – Bike Expense & Maintenance Tracker",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Configure CORS
origins = [str(origin) for origin in settings.BACKEND_CORS_ORIGINS] if settings.BACKEND_CORS_ORIGINS else ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Include API v1 router
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.on_event("startup")
def on_startup():
    """Verify engine and create tables if using SQLite local development fallback."""
    if settings.DATABASE_URL.startswith("sqlite"):
        Base.metadata.create_all(bind=engine)


@app.get("/", tags=["System"])
def root():
    """Root entry point with documentation links."""
    return {
        "message": "Welcome to BikeCare API",
        "version": "1.0.0",
        "docs": "/docs",
        "redoc": "/redoc",
        "health": f"{settings.API_V1_STR}/health",
    }
