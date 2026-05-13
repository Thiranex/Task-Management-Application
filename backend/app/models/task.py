from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


class TaskStatus(str, Enum):
    TODO = "todo"
    IN_PROGRESS = "in_progress"
    IN_REVIEW = "in_review"
    DONE = "done"


class TaskPriority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"


class TaskCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=2000)
    status: TaskStatus = TaskStatus.TODO
    priority: TaskPriority = TaskPriority.MEDIUM
    due_date: Optional[datetime] = None
    tags: List[str] = Field(default_factory=list)
    assigned_to: Optional[str] = None  # username


class TaskUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=2000)
    status: Optional[TaskStatus] = None
    priority: Optional[TaskPriority] = None
    due_date: Optional[datetime] = None
    tags: Optional[List[str]] = None
    assigned_to: Optional[str] = None


class TaskResponse(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    status: TaskStatus
    priority: TaskPriority
    due_date: Optional[datetime] = None
    tags: List[str] = []
    assigned_to: Optional[str] = None
    owner_id: str
    owner_username: str
    created_at: datetime
    updated_at: datetime


class TaskListResponse(BaseModel):
    tasks: List[TaskResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
