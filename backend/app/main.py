import logging
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.core.config import settings
from app.core.database import Base, engine
from app.api.v1 import api_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("bikecare")

# Initialize FastAPI application
app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    description="Production-quality REST API for BikeCare – Bike Expense & Maintenance Tracker",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Configure CORS Middleware
# Explicitly whitelist production Vercel frontend, local development hosts, and all Vercel previews
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://bikecare-gamma.vercel.app",
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        *settings.BACKEND_CORS_ORIGINS,
    ],
    allow_origin_regex=r"^https:\/\/.*\.vercel\.app$|^http:\/\/localhost(:\d+)?$|^http:\/\/127\.0\.0\.1(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Ensure any unhandled exception returns structured JSON while preserving CORS headers."""
    logger.error(f"Unhandled error on {request.method} {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal database or server error occurred. Please check database configuration."},
    )


# Include API v1 router
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.on_event("startup")
def on_startup():
    """Verify engine and create tables if using SQLite local development fallback."""
    if settings.DATABASE_URL.startswith("sqlite"):
        Base.metadata.create_all(bind=engine)


@app.api_route("/", methods=["GET", "HEAD"], tags=["System"])
def root():
    """Root entry point supporting GET and HEAD probes from Render/uptime monitors."""
    return {
        "message": "Welcome to BikeCare API",
        "version": "1.0.0",
        "docs": "/docs",
        "redoc": "/redoc",
        "health": f"{settings.API_V1_STR}/health",
    }
