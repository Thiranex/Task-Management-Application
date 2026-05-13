from fastapi import APIRouter, HTTPException, status, Depends, Query
from typing import Optional, List
from datetime import datetime
from bson import ObjectId
import math

from app.database import tasks_collection
from app.models.task import (
    TaskCreate, TaskUpdate, TaskResponse, TaskListResponse,
    TaskStatus, TaskPriority
)
from app.models.user import UserResponse
from app.utils.auth import get_current_user
from app.websocket import ws_manager

router = APIRouter(prefix="/tasks", tags=["Tasks"])


def task_doc_to_response(doc: dict) -> TaskResponse:
    """Convert a MongoDB task document to a TaskResponse."""
    return TaskResponse(
        id=str(doc["_id"]),
        title=doc["title"],
        description=doc.get("description"),
        status=doc["status"],
        priority=doc["priority"],
        due_date=doc.get("due_date"),
        tags=doc.get("tags", []),
        assigned_to=doc.get("assigned_to"),
        owner_id=doc["owner_id"],
        owner_username=doc["owner_username"],
        created_at=doc["created_at"],
        updated_at=doc["updated_at"],
    )


@router.post("/", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
async def create_task(
    task_data: TaskCreate,
    current_user: UserResponse = Depends(get_current_user),
):
    """Create a new task owned by the current user."""
    now = datetime.utcnow()
    task_doc = {
        "title": task_data.title,
        "description": task_data.description,
        "status": task_data.status.value,
        "priority": task_data.priority.value,
        "due_date": task_data.due_date,
        "tags": task_data.tags,
        "assigned_to": task_data.assigned_to,
        "owner_id": current_user.id,
        "owner_username": current_user.username,
        "created_at": now,
        "updated_at": now,
    }

    result = await tasks_collection.insert_one(task_doc)
    task_doc["_id"] = result.inserted_id

    # WebSocket broadcast
    await ws_manager.broadcast_to_user(
        current_user.id, 
        {"type": "task_created", "task_id": str(result.inserted_id)}
    )

    return task_doc_to_response(task_doc)


@router.get("/", response_model=TaskListResponse)
async def list_tasks(
    status: Optional[TaskStatus] = Query(None, description="Filter by status"),
    priority: Optional[TaskPriority] = Query(None, description="Filter by priority"),
    search: Optional[str] = Query(None, description="Search in title/description"),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    current_user: UserResponse = Depends(get_current_user),
):
    """List all tasks for the current user with filtering & pagination."""
    query: dict = {"owner_id": current_user.id}

    if status:
        query["status"] = status.value
    if priority:
        query["priority"] = priority.value
    if search:
        query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}},
        ]

    total = await tasks_collection.count_documents(query)
    skip = (page - 1) * page_size

    cursor = (
        tasks_collection.find(query)
        .sort("created_at", -1)
        .skip(skip)
        .limit(page_size)
    )
    docs = await cursor.to_list(length=page_size)

    return TaskListResponse(
        tasks=[task_doc_to_response(d) for d in docs],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=math.ceil(total / page_size) if total > 0 else 1,
    )


@router.get("/stats")
async def get_task_stats(current_user: UserResponse = Depends(get_current_user)):
    """Get task statistics for the current user's dashboard using optimized aggregation."""
    now = datetime.utcnow()
    pipeline = [
        {"$match": {"owner_id": current_user.id}},
        {"$facet": {
            "status_counts": [{"$group": {"_id": "$status", "count": {"$sum": 1}}}],
            "priority_counts": [{"$group": {"_id": "$priority", "count": {"$sum": 1}}}],
            "total": [{"$count": "count"}],
            "overdue": [
                {"$match": {"due_date": {"$lt": now}, "status": {"$ne": "done"}}},
                {"$count": "count"}
            ]
        }}
    ]

    result = await tasks_collection.aggregate(pipeline).to_list(length=1)
    data = result[0] if result else {}

    status_counts = data.get("status_counts", [])
    priority_counts = data.get("priority_counts", [])
    total_doc = data.get("total", [])
    overdue_doc = data.get("overdue", [])

    total = total_doc[0]["count"] if total_doc else 0
    overdue = overdue_doc[0]["count"] if overdue_doc else 0

    return {
        "total": total,
        "overdue": overdue,
        "by_status": {item["_id"]: item["count"] for item in status_counts},
        "by_priority": {item["_id"]: item["count"] for item in priority_counts},
    }


@router.get("/{task_id}", response_model=TaskResponse)
async def get_task(
    task_id: str,
    current_user: UserResponse = Depends(get_current_user),
):
    """Get a single task by ID (must be owner)."""
    try:
        oid = ObjectId(task_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid task ID format")

    task = await tasks_collection.find_one({"_id": oid, "owner_id": current_user.id})
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    return task_doc_to_response(task)


@router.patch("/{task_id}", response_model=TaskResponse)
async def update_task(
    task_id: str,
    task_data: TaskUpdate,
    current_user: UserResponse = Depends(get_current_user),
):
    """Partially update a task (must be owner)."""
    try:
        oid = ObjectId(task_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid task ID format")

    existing = await tasks_collection.find_one({"_id": oid, "owner_id": current_user.id})
    if not existing:
        raise HTTPException(status_code=404, detail="Task not found")

    update_fields = task_data.model_dump(exclude_unset=True)
    if not update_fields:
        return task_doc_to_response(existing)

    # Serialize enums to their values
    for key in ("status", "priority"):
        if key in update_fields and update_fields[key] is not None:
            update_fields[key] = update_fields[key].value

    update_fields["updated_at"] = datetime.utcnow()

    await tasks_collection.update_one({"_id": oid}, {"$set": update_fields})
    updated = await tasks_collection.find_one({"_id": oid})

    await ws_manager.broadcast_to_user(
        current_user.id, 
        {"type": "task_updated", "task_id": task_id}
    )

    return task_doc_to_response(updated)


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(
    task_id: str,
    current_user: UserResponse = Depends(get_current_user),
):
    """Delete a task (must be owner)."""
    try:
        oid = ObjectId(task_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid task ID format")

    result = await tasks_collection.delete_one({"_id": oid, "owner_id": current_user.id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Task not found")

    await ws_manager.broadcast_to_user(
        current_user.id, 
        {"type": "task_deleted", "task_id": task_id}
    )
