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

# Outermost CORS middleware to ensure CORS headers are ALWAYS attached even on 500 exceptions
@app.middleware("http")
async def cors_headers_middleware(request: Request, call_next):
    origin = request.headers.get("origin")
    
    if request.method == "OPTIONS":
        response = JSONResponse(status_code=200, content={"status": "ok"})
    else:
        try:
            response = await call_next(request)
        except Exception as exc:
            logger.error(f"Unhandled error on {request.method} {request.url.path}: {exc}", exc_info=True)
            response = JSONResponse(
                status_code=500,
                content={"detail": f"Database or internal server error: {str(exc)}"},
            )

    if origin:
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Credentials"] = "true"
        response.headers["Access-Control-Allow-Methods"] = "DELETE, GET, HEAD, OPTIONS, PATCH, POST, PUT"
        response.headers["Access-Control-Allow-Headers"] = "*"
        response.headers["Access-Control-Expose-Headers"] = "*"
    return response


# Standard CORS middleware
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
