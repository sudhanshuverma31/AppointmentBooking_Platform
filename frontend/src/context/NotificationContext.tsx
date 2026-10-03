import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from 'react';
import { NotificationItem } from '../types';
import { notificationApi } from '../services/api';

const SSE_BASE = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '');
const MAX_RECONNECT_DELAY_MS = 30_000; // cap at 30 s

interface NotificationContextType {
  notifications: NotificationItem[];
  unreadCount: number;
  isConnected: boolean;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  refresh: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);

  const esRef = useRef<EventSource | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectDelay = useRef(1_000); // exponential back-off seed

  /** Load existing notifications from REST API */
  const refresh = useCallback(async () => {
    try {
      const res = await notificationApi.getNotifications();
      setNotifications(Array.isArray(res.data.notifications) ? res.data.notifications : []);
      setUnreadCount(res.data.unreadCount || 0);
    } catch {
      // silently fail — SSE will still work
    }
  }, []);

  /** Open / re-open the SSE connection */
  const connect = useCallback(() => {
    const token = localStorage.getItem('care_sync_token');
    if (!token) return;

    // Clean up old connection
    if (esRef.current) {
      esRef.current.close();
      esRef.current = null;
    }

    const url = `${SSE_BASE}/notifications/stream?token=${encodeURIComponent(token)}`;
    const es = new EventSource(url);
    esRef.current = es;

    // ── on "connected" event ────────────────────────────────────────────────
    es.addEventListener('connected', () => {
      setIsConnected(true);
      reconnectDelay.current = 1_000; // reset back-off
      refresh(); // load existing notifications once connected
    });

    // ── on "notification" event (live push) ─────────────────────────────────
    es.addEventListener('notification', (e: MessageEvent) => {
      try {
        const notif: NotificationItem = JSON.parse(e.data);
        setNotifications((prev) => {
          // Avoid duplicates
          if (prev.some((n) => n._id === notif._id)) return prev;
          return [notif, ...prev];
        });
        if (!notif.read) {
          setUnreadCount((c) => c + 1);
        }

        // Browser push notification (if permission granted)
        if (Notification.permission === 'granted') {
          new Notification(notif.title, {
            body: notif.message,
            icon: '/favicon.ico',
          });
        }
      } catch {/* ignore parse errors */}
    });

    // ── on error — exponential back-off reconnect ────────────────────────────
    es.onerror = () => {
      setIsConnected(false);
      es.close();
      esRef.current = null;

      const delay = Math.min(reconnectDelay.current, MAX_RECONNECT_DELAY_MS);
      reconnectDelay.current = Math.min(delay * 2, MAX_RECONNECT_DELAY_MS);

      reconnectTimer.current = setTimeout(() => {
        connect();
      }, delay);
    };
  }, [refresh]);

  /** Start SSE when user logs in (token present), stop on logout */
  useEffect(() => {
    const token = localStorage.getItem('care_sync_token');

    if (token) {
      connect();
      // Request browser notification permission
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }

    return () => {
      esRef.current?.close();
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /** Re-connect when localStorage token changes (login / logout) */
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'care_sync_token') {
        if (e.newValue) {
          connect();
        } else {
          // Logged out — close stream and clear state
          esRef.current?.close();
          esRef.current = null;
          setNotifications([]);
          setUnreadCount(0);
          setIsConnected(false);
        }
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [connect]);

  const markRead = useCallback(async (id: string) => {
    try {
      await notificationApi.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {/* ignore */}
  }, []);

  const markAllRead = useCallback(async () => {
    try {
      await notificationApi.markAsRead('all');
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {/* ignore */}
  }, []);

  return (
    <NotificationContext.Provider
      value={{ notifications, unreadCount, isConnected, markRead, markAllRead, refresh }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = (): NotificationContextType => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within a NotificationProvider');
  return ctx;
};
