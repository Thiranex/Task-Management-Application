import json
from typing import Dict, List
from fastapi import WebSocket
import asyncio


class ConnectionManager:
    """
    WebSocket connection manager that broadcasts task events
    to all connected clients of a given user.
    """

    def __init__(self):
        # user_id -> list of active WebSocket connections
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, user_id: str):
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = []
        self.active_connections[user_id].append(websocket)

    def disconnect(self, websocket: WebSocket, user_id: str):
        if user_id in self.active_connections:
            self.active_connections[user_id].discard(websocket) \
                if hasattr(self.active_connections[user_id], 'discard') \
                else None
            try:
                self.active_connections[user_id].remove(websocket)
            except ValueError:
                pass
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]

    async def broadcast_to_user(self, user_id: str, event: dict):
        """Send a JSON event to all connections of a specific user."""
        if user_id not in self.active_connections:
            return
        dead = []
        for ws in self.active_connections[user_id]:
            try:
                await ws.send_text(json.dumps(event))
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.disconnect(ws, user_id)


ws_manager = ConnectionManager()
