import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import {
  deleteAllNotifications as deleteAllNotificationsApi,
  deleteNotification as deleteNotificationApi,
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../services/api';
import { useAuth } from './AuthContext';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [readCount, setReadCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [filteredCount, setFilteredCount] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const queryRef = useRef(null);
  const requestIdRef = useRef(0);

  const refresh = useCallback(async (params) => {
    if (!user) {
      requestIdRef.current += 1;
      queryRef.current = null;
      setNotifications([]);
      setUnreadCount(0);
      setReadCount(0);
      setTotalCount(0);
      setFilteredCount(0);
      return;
    }
    if (params) queryRef.current = params;
    const requestId = ++requestIdRef.current;
    setLoading(true);
    try {
      const res = await getNotifications(queryRef.current || undefined);
      if (requestId !== requestIdRef.current) return;
      setNotifications(res.data?.notifications || []);
      setUnreadCount(res.data?.unread_count ?? 0);
      setReadCount(res.data?.read_count ?? 0);
      setTotalCount(res.data?.total_count ?? 0);
      setFilteredCount(res.data?.filtered_count ?? res.data?.total_count ?? 0);
      setError('');
    } catch (requestError) {
      if (requestId === requestIdRef.current) {
        setError(requestError.message || 'Failed to load notifications.');
      }
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refresh();
    if (!user) return undefined;
    const id = setInterval(refresh, 60000);
    return () => clearInterval(id);
  }, [refresh, user]);

  const markRead = async (id) => {
    await markNotificationRead(id, true);
    await refresh();
  };

  const markUnread = async (id) => {
    await markNotificationRead(id, false);
    await refresh();
  };

  const markAllRead = async () => {
    await markAllNotificationsRead();
    await refresh();
  };

  const remove = async (id) => {
    await deleteNotificationApi(id);
    await refresh();
  };

  const removeAll = async (filter) => {
    await deleteAllNotificationsApi(filter);
    await refresh();
  };

  return (
    <NotificationContext.Provider
      value={{ notifications, unreadCount, readCount, totalCount, filteredCount, loading, error, refresh, markRead, markUnread, markAllRead, remove, removeAll }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return ctx;
}
