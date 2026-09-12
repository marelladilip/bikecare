from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, EmailStr, ConfigDict, field_validator


class SendOTPRequest(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None


class OTPResponse(BaseModel):
    message: str
    email: str
    smtp_configured: bool = True
    debug_otp: Optional[str] = None


class UserRegister(BaseModel):
    email: EmailStr
    password: str
    full_name: Optional[str] = None
    otp_code: str

    @field_validator("password")
    @classmethod
    def validate_password_length(cls, v: str) -> str:
        if len(v) < 6:
            raise ValueError("Password must be at least 6 characters long")
        return v


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class ProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    currency_symbol: Optional[str] = "₹"
    distance_unit: Optional[str] = "KM"
    volume_unit: Optional[str] = "L"


class ProfileResponse(BaseModel):
    id: UUID
    email: EmailStr
    full_name: Optional[str] = None
    currency_symbol: str = "₹"
    distance_unit: str = "KM"
    volume_unit: str = "L"
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int


class AuthResponse(Token):
    user: ProfileResponse


class TokenPayload(BaseModel):
    sub: Optional[str] = None
    exp: Optional[int] = None


class PasswordChange(BaseModel):
    current_password: str
    new_password: str

    @field_validator("new_password")
    @classmethod
    def validate_new_pass(cls, v: str) -> str:
        if len(v) < 6:
            raise ValueError("New password must be at least 6 characters long")
        return v


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

    @field_validator("new_password")
    @classmethod
    def validate_reset_pass(cls, v: str) -> str:
        if len(v) < 6:
            raise ValueError("New password must be at least 6 characters long")
        return v
