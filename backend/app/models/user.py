from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime


class UserCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=6)
    full_name: Optional[str] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: str
    username: str
    email: str
    full_name: Optional[str] = None
    created_at: datetime
    is_active: bool = True


class UserInDB(BaseModel):
    id: Optional[str] = None
    username: str
    email: str
    full_name: Optional[str] = None
    hashed_password: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    is_active: bool = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class TokenData(BaseModel):
    user_id: Optional[str] = None
    email: Optional[str] = None
