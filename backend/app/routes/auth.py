from fastapi import APIRouter, HTTPException, status
from datetime import datetime

from app.database import users_collection
from app.models.user import UserCreate, UserLogin, UserResponse, Token
from app.utils.hashing import hash_password, verify_password
from app.utils.auth import create_access_token, get_current_user
from fastapi import Depends

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate):
    """Register a new user account."""
    # Check for existing email
    if await users_collection.find_one({"email": user_data.email}):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists",
        )

    # Check for existing username
    if await users_collection.find_one({"username": user_data.username}):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This username is already taken",
        )

    # Create user document
    now = datetime.utcnow()
    user_doc = {
        "username": user_data.username,
        "email": user_data.email,
        "full_name": user_data.full_name,
        "hashed_password": hash_password(user_data.password),
        "created_at": now,
        "updated_at": now,
        "is_active": True,
    }

    result = await users_collection.insert_one(user_doc)
    user_id = str(result.inserted_id)

    access_token = create_access_token(
        data={"sub": user_id, "email": user_data.email}
    )

    user_response = UserResponse(
        id=user_id,
        username=user_data.username,
        email=user_data.email,
        full_name=user_data.full_name,
        created_at=now,
        is_active=True,
    )

    return Token(access_token=access_token, user=user_response)


@router.post("/login", response_model=Token)
async def login(credentials: UserLogin):
    """Login with email and password, returns JWT token."""
    user = await users_collection.find_one({"email": credentials.email})

    if not user or not verify_password(credentials.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    if not user.get("is_active", True):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated",
        )

    user_id = str(user["_id"])
    access_token = create_access_token(
        data={"sub": user_id, "email": user["email"]}
    )

    user_response = UserResponse(
        id=user_id,
        username=user["username"],
        email=user["email"],
        full_name=user.get("full_name"),
        created_at=user["created_at"],
        is_active=user.get("is_active", True),
    )

    return Token(access_token=access_token, user=user_response)


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: UserResponse = Depends(get_current_user)):
    """Get the currently authenticated user's profile."""
    return current_user
