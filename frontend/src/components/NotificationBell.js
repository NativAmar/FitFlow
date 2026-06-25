import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useSocket } from "../context/SocketContext";

// ── Relative timestamp ────────────────────────────────────────────────────────

function relativeTime(isoString) {
  if (!isoString) return "";
  const diff = Date.now() - new Date(isoString).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60)  return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60)  return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24)    return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30)     return `${days}d ago`;
  return new Date(isoString).toLocaleDateString();
}

// ── Safe internal navigation ──────────────────────────────────────────────────

function isSafeInternalLink(link) {
  if (!link || typeof link !== "string") return false;
  if (!link.startsWith("/")) return false;
  // Reject javascript: and any URL with ://
  if (/javascript:/i.test(link)) return false;
  if (link.includes("://")) return false;
  return true;
}

// ── Single notification item ──────────────────────────────────────────────────

function NotificationItem({ notification, onMarkRead, onNavigate }) {
  const actorName =
    notification.actor
      ? notification.actor.displayName ||
        `${notification.actor.firstName} ${notification.actor.lastName}`
      : null;

  function handleClick() {
    if (!notification.isRead) {
      onMarkRead(notification.id);
    }
    const link = notification.metadata && notification.metadata.link;
    if (isSafeInternalLink(link)) {
      onNavigate(link);
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleClick();
    }
  }

  return (
    <div
      className={`notif-item${notification.isRead ? "" : " notif-item--unread"}`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={notification.title}
    >
      {!notification.isRead && <span className="notif-unread-dot" aria-hidden="true" />}
      <div className="notif-item-body">
        <div className="notif-item-title">{notification.title}</div>
        <div className="notif-item-message">{notification.message}</div>
        <div className="notif-item-meta">
          {actorName && (
            <span className="notif-item-actor">From: {actorName}</span>
          )}
          <span className="notif-item-time">
            {relativeTime(notification.createdAt)}
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Bell component ────────────────────────────────────────────────────────────

function NotificationBell() {
  const {
    connected,
    connectionError,
    panelError,
    notifications,
    unreadCount,
    markOneRead,
    markAllRead,
  } = useSocket();
  const navigate  = useNavigate();
  const [open, setOpen] = useState(false);
  const panelRef  = useRef(null);
  const buttonRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleOutside(e) {
      if (
        panelRef.current  && !panelRef.current.contains(e.target) &&
        buttonRef.current && !buttonRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function handleEsc(e) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [open]);

  const handleNavigate = useCallback(
    (link) => {
      setOpen(false);
      navigate(link);
    },
    [navigate]
  );

  const displayCount = unreadCount > 99 ? "99+" : unreadCount;

  return (
    <div className="notif-bell-wrapper">
      <button
        ref={buttonRef}
        type="button"
        className="notif-bell-btn"
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="notif-bell-icon" aria-hidden="true">🔔</span>
        {unreadCount > 0 && (
          <span className="notif-badge" aria-hidden="true">
            {displayCount}
          </span>
        )}
      </button>

      {open && (
        <div ref={panelRef} className="notif-panel" role="dialog" aria-label="Notifications">
          <div className="notif-panel-header">
            <span className="notif-panel-title">Notifications</span>
            {!connected && !connectionError && (
              <span className="notif-status notif-status--disconnected">Reconnecting…</span>
            )}
            {connectionError && (
              <span className="notif-status notif-status--error">{connectionError}</span>
            )}
            {panelError && !connectionError && (
              <span className="notif-status notif-status--error">{panelError}</span>
            )}
            {unreadCount > 0 && (
              <button
                type="button"
                className="notif-mark-all-btn"
                onClick={() => markAllRead()}
              >
                Mark all as read
              </button>
            )}
          </div>

          <div className="notif-list">
            {notifications.length === 0 ? (
              <div className="notif-empty">
                {connectionError
                  ? "Notifications unavailable — check your connection."
                  : "No notifications yet."}
              </div>
            ) : (
              notifications.map((n) => (
                <NotificationItem
                  key={n.id}
                  notification={n}
                  onMarkRead={markOneRead}
                  onNavigate={handleNavigate}
                />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationBell;
