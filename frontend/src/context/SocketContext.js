import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";
import { API_BASE_URL } from "../services/api";

// Socket.IO must connect to the origin only — strip any /api path from API_BASE_URL
const SOCKET_URL = (() => {
  try {
    const u = new URL(API_BASE_URL);
    return `${u.protocol}//${u.host}`;
  } catch {
    return API_BASE_URL;
  }
})();
const MAX_NOTIFICATIONS = 50;

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { token, isAuthenticated, loading: authLoading } = useAuth();
  const [connected, setConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const [panelError, setPanelError] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [latestNotification, setLatestNotification] = useState(null);
  const socketRef = useRef(null);
  const seenIdsRef = useRef(new Set());

  useEffect(() => {
    // Wait until auth bootstrap completes
    if (authLoading) return;

    if (!isAuthenticated || !token) {
      // Disconnect and clear state on logout
      if (socketRef.current) {
        socketRef.current.removeAllListeners();
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setConnected(false);
      setConnectionError(null);
      setPanelError(null);
      setNotifications([]);
      setUnreadCount(0);
      setLatestNotification(null);
      seenIdsRef.current = new Set();
      return;
    }

    // Guard against double-mount in React StrictMode:
    // cleanup runs between the two effect firings and nulls socketRef.current,
    // so a second socket is created on the second mount — this is correct.
    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 20,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      setConnectionError(null);
      // Request the latest notifications on every (re)connect
      socket.emit("notifications:request", { limit: 20 });
    });

    socket.on("disconnect", () => {
      setConnected(false);
    });

    socket.on("connect_error", (err) => {
      setConnected(false);
      const msg = String(err.message || "");
      const isAuth =
        msg.includes("UNAUTHORIZED") ||
        msg.includes("TOKEN") ||
        msg.includes("USER_NOT_FOUND") ||
        msg.includes("ACCOUNT_INACTIVE");
      setConnectionError(
        isAuth
          ? "Authentication error — please log in again."
          : "Cannot connect to notification server."
      );
    });

    socket.on("notifications:list", (data) => {
      if (data && Array.isArray(data.notifications)) {
        // Seed the dedup set from the loaded list
        seenIdsRef.current = new Set(data.notifications.map((n) => n.id));
        setNotifications(data.notifications.slice(0, MAX_NOTIFICATIONS));
        setUnreadCount(
          typeof data.unreadCount === "number" ? data.unreadCount : 0
        );
        setPanelError(null);
      }
    });

    socket.on("notification:new", (notification) => {
      if (!notification || typeof notification.id === "undefined") return;
      // Duplicate guard: check ref before touching any state
      if (seenIdsRef.current.has(notification.id)) return;
      seenIdsRef.current.add(notification.id);
      setNotifications((prev) => [notification, ...prev].slice(0, MAX_NOTIFICATIONS));
      setUnreadCount((prev) => prev + 1);
      setLatestNotification(notification);
    });

    socket.on("notification:read", (data) => {
      if (!data) return;
      setPanelError(null);
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === data.notificationId
            ? { ...n, isRead: true, readAt: data.readAt }
            : n
        )
      );
      if (typeof data.unreadCount === "number") {
        setUnreadCount(data.unreadCount);
      }
    });

    socket.on("notifications:all-read", (data) => {
      setPanelError(null);
      const readAt = data && data.readAt ? data.readAt : new Date().toISOString();
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: true, readAt }))
      );
      setUnreadCount(0);
    });

    socket.on("notification:error", (err) => {
      const msg = (err && err.message) ? err.message : "Notification operation failed.";
      setPanelError(msg);
    });

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
      seenIdsRef.current = new Set();
    };
  }, [authLoading, isAuthenticated, token]);

  const markOneRead = useCallback((notificationId) => {
    const s = socketRef.current;
    if (s && s.connected) {
      s.emit("notification:mark-read", { notificationId });
    }
  }, []);

  const markAllRead = useCallback(() => {
    const s = socketRef.current;
    if (s && s.connected) {
      s.emit("notifications:mark-all-read");
    }
  }, []);

  const requestNotifications = useCallback((opts = {}) => {
    const s = socketRef.current;
    if (s && s.connected) {
      s.emit("notifications:request", opts);
    }
  }, []);

  const value = {
    connected,
    connectionError,
    panelError,
    notifications,
    unreadCount,
    latestNotification,
    markOneRead,
    markAllRead,
    requestNotifications,
  };

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
}

export function useSocket() {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error("useSocket must be used inside SocketProvider");
  return ctx;
}
