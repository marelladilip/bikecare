from typing import Generator, Optional
from uuid import UUID
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import decode_access_token
from app.models.user import Profile

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/api/v1/auth/token",
    auto_error=False,
)


def get_current_user(
    token: Optional[str] = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> Profile:
    """Dependency to extract and validate current authenticated user from Bearer JWT."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if not token:
        raise credentials_exception

    payload = decode_access_token(token)
    if not payload:
        raise credentials_exception

    user_id_str: str = payload.get("sub")
    if not user_id_str:
        raise credentials_exception

    try:
        user_uuid = UUID(user_id_str)
    except ValueError:
        raise credentials_exception

    user = db.query(Profile).filter(Profile.id == user_uuid).first()
    if not user:
        # If user exists in Supabase auth but not in profiles table yet,
        # create profile on the fly
        email = payload.get("email") or f"{user_id_str}@user.bikecare"
        user = Profile(
            id=user_uuid,
            email=email,
            full_name=payload.get("user_metadata", {}).get("full_name") or payload.get("full_name"),
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    return user
