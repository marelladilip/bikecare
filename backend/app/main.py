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
    title="Vehicle'Nest API",
    version="1.0.0",
    description="Production REST API for Vehicle'Nest – Care That Keeps You Moving",
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


from sqlalchemy import text

@app.on_event("startup")
def on_startup():
    """Verify engine and ensure tables/columns are synchronized in SQLite and PostgreSQL."""
    try:
        Base.metadata.create_all(bind=engine)
        if not settings.DATABASE_URL.startswith("sqlite"):
            with engine.connect() as conn:
                conn.execute(text("ALTER TABLE profiles ADD COLUMN IF NOT EXISTS hashed_password TEXT;"))
                conn.execute(text("ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;"))
                conn.execute(text("ALTER TABLE bikes ADD COLUMN IF NOT EXISTS vehicle_type TEXT DEFAULT 'BIKE';"))
                conn.execute(text("""
                    CREATE TABLE IF NOT EXISTS email_otps (
                        id UUID PRIMARY KEY,
                        email TEXT NOT NULL,
                        otp_code VARCHAR(10) NOT NULL,
                        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
                        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
                        is_used BOOLEAN NOT NULL DEFAULT FALSE,
                        attempts INTEGER NOT NULL DEFAULT 0
                    );
                """))
                conn.execute(text("CREATE INDEX IF NOT EXISTS idx_email_otps_email ON email_otps(email);"))
                conn.commit()
    except Exception as e:
        logger.warning(f"Startup schema sync note: {e}")


@app.api_route("/", methods=["GET", "HEAD"], tags=["System"])
def root():
    """Root entry point supporting GET and HEAD probes from Render/uptime monitors."""
    return {
        "message": "Welcome to Vehicle'Nest API",
        "tagline": "Care That Keeps You Moving",
        "version": "1.0.0",
        "docs": "/docs",
        "redoc": "/redoc",
        "health": f"{settings.API_V1_STR}/health",
    }
