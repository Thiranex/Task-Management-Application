from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from bson import ObjectId

from app.config import settings
from app.database import users_collection
from app.models.user import TokenData, UserResponse

security = HTTPBearer()


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a signed JWT access token."""
    to_encode = data.copy()
    expire = datetime.utcnow() + (
        expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_token(token: str) -> TokenData:
    """Decode and validate a JWT token."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: str = payload.get("sub")
        email: str = payload.get("email")
        if user_id is None:
            raise credentials_exception
        return TokenData(user_id=user_id, email=email)
    except JWTError:
        raise credentials_exception


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> UserResponse:
    """FastAPI dependency: get current authenticated user from JWT."""
    token_data = decode_token(credentials.credentials)

    try:
        user = await users_collection.find_one({"_id": ObjectId(token_data.user_id)})
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid user ID in token",
        )

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )

    if not user.get("is_active", True):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user account",
        )

    return UserResponse(
        id=str(user["_id"]),
        username=user["username"],
        email=user["email"],
        full_name=user.get("full_name"),
        created_at=user["created_at"],
        is_active=user.get("is_active", True),
    )
