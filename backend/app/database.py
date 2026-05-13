import motor.motor_asyncio
from app.config import settings

client = motor.motor_asyncio.AsyncIOMotorClient(settings.MONGODB_URL)
db = client[settings.DATABASE_NAME]

# Collections
users_collection = db["users"]
tasks_collection = db["tasks"]


async def create_indexes():
    """Create database indexes for performance."""
    # Users: unique email index
    await users_collection.create_index("email", unique=True)
    await users_collection.create_index("username", unique=True)

    # Tasks: index on owner and status for fast filtering
    await tasks_collection.create_index("owner_id")
    await tasks_collection.create_index([("owner_id", 1), ("status", 1)])
    await tasks_collection.create_index([("owner_id", 1), ("priority", 1)])
    await tasks_collection.create_index("due_date")
