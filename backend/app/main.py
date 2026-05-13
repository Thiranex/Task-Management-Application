from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Query
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.config import settings
from app.database import create_indexes
from app.routes import auth, tasks
from app.websocket import ws_manager
from app.utils.auth import decode_token


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events."""
    # Startup
    await create_indexes()
    print(f"SUCCESS: {settings.APP_NAME} started - MongoDB indexes created")
    yield
    # Shutdown
    print("Application shutting down...")


app = FastAPI(
    title=settings.APP_NAME,
    description="A full-featured Task Management REST API built with FastAPI and MongoDB.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(auth.router, prefix="/api")
app.include_router(tasks.router, prefix="/api")


# ── Health Check ──────────────────────────────────────────────────────────────
@app.get("/", tags=["Health"])
async def root():
    return {"status": "ok", "app": settings.APP_NAME, "version": "1.0.0"}


@app.get("/health", tags=["Health"])
async def health():
    return {"status": "healthy"}


# ── WebSocket endpoint ────────────────────────────────────────────────────────
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket, token: str = Query(...)):
    """
    WebSocket endpoint. Clients connect with ?token=<JWT>.
    After authentication, the server pushes real-time task events.
    """
    try:
        token_data = decode_token(token)
        user_id = token_data.user_id
    except Exception:
        await websocket.close(code=4001)
        return

    await ws_manager.connect(websocket, user_id)
    try:
        await websocket.send_json({"type": "connected", "message": "Real-time updates active"})
        while True:
            # Keep connection alive; client can send pings
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket, user_id)
