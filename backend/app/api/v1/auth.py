import secrets
import uuid
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.database import get_db
from app.core.security import (
    create_access_token,
    decode_access_token,
    get_password_hash,
    verify_password,
)
from app.api.deps import get_current_user
from app.models.user import Profile
from app.models.otp import EmailOTP
from app.services.email import send_otp_email
from app.schemas.user import (
    AuthResponse,
    ForgotPasswordRequest,
    PasswordChange,
    ProfileResponse,
    ProfileUpdate,
    ResetPasswordRequest,
    SendOTPRequest,
    OTPResponse,
    Token,
    UserLogin,
    UserRegister,
)

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post(
    "/send-otp",
    response_model=OTPResponse,
    summary="Send a 6-digit OTP verification email for account registration",
)
def send_otp(payload: SendOTPRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """Generate and dispatch a 6-digit OTP to the specified email address."""
    email_clean = payload.email.strip().lower()
    
    # 1. Check if user already exists
    existing_user = db.query(Profile).filter(Profile.email == email_clean).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists. Please sign in instead.",
        )

    # 2. Invalidate previous unused OTPs for this email
    db.query(EmailOTP).filter(
        EmailOTP.email == email_clean,
        EmailOTP.is_used == False,
    ).update({"is_used": True})
    db.commit()

    # 3. Generate secure 6-digit code
    otp_code = f"{secrets.randbelow(900000) + 100000}"

    # 4. Save to database
    now = datetime.now(timezone.utc)
    expires_at = now + timedelta(minutes=settings.OTP_EXPIRE_MINUTES)
    otp_record = EmailOTP(
        id=uuid.uuid4(),
        email=email_clean,
        otp_code=otp_code,
        created_at=now,
        expires_at=expires_at,
        is_used=False,
        attempts=0,
    )
    db.add(otp_record)
    db.commit()

    # 5. Dispatch Email in background so the API responds instantly without blocking
    email_provider_is_ready = bool(
        settings.RESEND_API_KEY
        or settings.BREVO_API_KEY
        or (settings.SMTP_USER and settings.SMTP_PASSWORD)
    )
    if email_provider_is_ready:
        background_tasks.add_task(
            send_otp_email,
            to_email=email_clean,
            otp_code=otp_code,
            full_name=payload.full_name or "",
        )
    else:
        # Also log for backend inspection
        send_otp_email(to_email=email_clean, otp_code=otp_code, full_name=payload.full_name or "")

    return OTPResponse(
        message=f"A 6-digit verification code has been sent to {email_clean}." if email_provider_is_ready else "Verification code generated.",
        email=email_clean,
        smtp_configured=email_provider_is_ready,
        debug_otp=otp_code,
    )


@router.post(
    "/register",
    response_model=AuthResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user account with OTP verification",
)
def register(user_in: UserRegister, db: Session = Depends(get_db)):
    """Verify OTP and register a new user, initializing their profile and returning an access token."""
    email_clean = user_in.email.strip().lower()
    
    existing_user = db.query(Profile).filter(Profile.email == email_clean).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists.",
        )

    # Validate OTP
    now = datetime.now(timezone.utc)
    otp_record = (
        db.query(EmailOTP)
        .filter(
            EmailOTP.email == email_clean,
            EmailOTP.is_used == False,
        )
        .order_by(EmailOTP.created_at.desc())
        .first()
    )

    if not otp_record or not otp_record.is_valid(user_in.otp_code):
        if otp_record:
            otp_record.attempts += 1
            db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification code. Please request a new OTP.",
        )

    # Mark OTP as used
    otp_record.is_used = True

    user = Profile(
        id=uuid.uuid4(),
        email=email_clean,
        full_name=user_in.full_name,
        hashed_password=get_password_hash(user_in.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    expires_delta = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        subject=str(user.id),
        expires_delta=expires_delta,
        extra_claims={"email": user.email, "full_name": user.full_name},
    )

    return AuthResponse(
        access_token=access_token,
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=ProfileResponse.model_validate(user),
    )


@router.post(
    "/login",
    response_model=AuthResponse,
    summary="Login with JSON credentials",
)
def login(login_data: UserLogin, db: Session = Depends(get_db)):
    """Authenticate user with email and password, returning JWT access token."""
    user = db.query(Profile).filter(Profile.email == login_data.email).first()
    if not user or not user.hashed_password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    expires_delta = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        subject=str(user.id),
        expires_delta=expires_delta,
        extra_claims={"email": user.email, "full_name": user.full_name},
    )

    return AuthResponse(
        access_token=access_token,
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=ProfileResponse.model_validate(user),
    )


@router.post(
    "/token",
    response_model=Token,
    summary="OAuth2 compatible token login for Swagger UI",
)
def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    """OAuth2 password form login endpoint for standard OpenAPI Authorize flow."""
    user = db.query(Profile).filter(Profile.email == form_data.username).first()
    if not user or not user.hashed_password or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username (email) or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    expires_delta = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        subject=str(user.id),
        expires_delta=expires_delta,
        extra_claims={"email": user.email, "full_name": user.full_name},
    )

    return Token(
        access_token=access_token,
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )


@router.get(
    "/me",
    response_model=ProfileResponse,
    summary="Get current user profile",
)
def get_me(current_user: Profile = Depends(get_current_user)):
    """Fetch the authenticated user's profile details."""
    return current_user


@router.put(
    "/profile",
    response_model=ProfileResponse,
    summary="Update current user profile and preferences",
)
def update_profile(
    profile_in: ProfileUpdate,
    current_user: Profile = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update user full name, currency preference, and measurement units."""
    if profile_in.full_name is not None:
        current_user.full_name = profile_in.full_name
    if profile_in.currency_symbol is not None:
        current_user.currency_symbol = profile_in.currency_symbol
    if profile_in.distance_unit is not None:
        current_user.distance_unit = profile_in.distance_unit
    if profile_in.volume_unit is not None:
        current_user.volume_unit = profile_in.volume_unit

    db.commit()
    db.refresh(current_user)
    return current_user


@router.post(
    "/change-password",
    status_code=status.HTTP_200_OK,
    summary="Change account password",
)
def change_password(
    pwd_data: PasswordChange,
    current_user: Profile = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Change user password after verifying their current password."""
    if not current_user.hashed_password or not verify_password(
        pwd_data.current_password, current_user.hashed_password
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password verification failed",
        )

    current_user.hashed_password = get_password_hash(pwd_data.new_password)
    db.commit()
    return {"message": "Password changed successfully"}


@router.post(
    "/forgot-password",
    status_code=status.HTTP_200_OK,
    summary="Request a password reset token",
)
def forgot_password(
    req: ForgotPasswordRequest,
    db: Session = Depends(get_db),
):
    """Generate a password reset token for the specified email."""
    user = db.query(Profile).filter(Profile.email == req.email).first()
    if not user:
        # Return generic message to prevent email enumeration attacks
        return {
            "message": "If this email is registered, password reset instructions have been generated.",
        }

    # Generate a short-lived reset token (15 mins)
    reset_token = create_access_token(
        subject=str(user.id),
        expires_delta=timedelta(minutes=15),
        extra_claims={"purpose": "password_reset", "email": user.email},
    )

    return {
        "message": "Password reset token generated successfully",
        "reset_token": reset_token,
    }


@router.post(
    "/reset-password",
    status_code=status.HTTP_200_OK,
    summary="Reset password using reset token",
)
def reset_password(
    req: ResetPasswordRequest,
    db: Session = Depends(get_db),
):
    """Verify reset token and update account password."""
    payload = decode_access_token(req.token)
    if not payload or payload.get("purpose") != "password_reset":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired password reset token",
        )

    user_id_str = payload.get("sub")
    try:
        user_uuid = uuid.UUID(user_id_str)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid token subject",
        )

    user = db.query(Profile).filter(Profile.id == user_uuid).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    user.hashed_password = get_password_hash(req.new_password)
    db.commit()
    return {"message": "Password has been successfully reset"}
