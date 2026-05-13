import { useEffect, useRef, useCallback } from "react";

const WS_BASE = import.meta.env.VITE_WS_URL || "ws://localhost:8000/ws";

/**
 * Custom hook for WebSocket real-time task updates.
 * @param {Function} onMessage - callback(event: {type, payload}) when server sends data
 */
export function useTaskSocket(onMessage) {
  const wsRef = useRef(null);
  const reconnectTimer = useRef(null);

  const connect = useCallback(() => {
    const token = localStorage.getItem("access_token");
    if (!token) return;

    const ws = new WebSocket(`${WS_BASE}?token=${token}`);
    wsRef.current = ws;

    ws.onmessage = (evt) => {
      try {
        const data = JSON.parse(evt.data);
        onMessage(data);
      } catch {}
    };

    ws.onclose = () => {
      // Auto-reconnect after 3 seconds
      reconnectTimer.current = setTimeout(connect, 3000);
    };

    ws.onerror = () => {
      ws.close();
    };

    // Keepalive ping every 25s
    const pingInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) ws.send("ping");
    }, 25000);

    ws.onclose = () => {
      clearInterval(pingInterval);
      reconnectTimer.current = setTimeout(connect, 3000);
    };
  }, [onMessage]);

  useEffect(() => {
    connect();
    return () => {
      clearTimeout(reconnectTimer.current);
      wsRef.current?.close();
    };
  }, [connect]);
}
