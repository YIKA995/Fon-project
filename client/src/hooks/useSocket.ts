import { useEffect, useRef } from 'react';
import { io, type Socket } from 'socket.io-client';
import toast from 'react-hot-toast';
import { API_BASE_URL, tokenStore } from '../api/client';
import { useAuth } from '../context/AuthContext';
import type { Alert, NotificationItem } from '../types';

export function useRealtimeAlerts(onNewAlert?: (alert: Alert) => void) {
  const { user } = useAuth();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const token = tokenStore.getAccess();
    if (!user || !token) return undefined;

    const socket = io(API_BASE_URL, { auth: { token }, transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    socket.on('alert:new', (alert: Alert) => {
      toast(`[${alert.severity}] ${alert.title}`, {
        icon: alert.severity === 'CRITICAL' || alert.severity === 'HIGH' ? '🛑' : '⚠️',
        duration: 6000,
      });
      onNewAlert?.(alert);
    });

    socket.on('notification:new', ({ notification }: { notification: NotificationItem }) => {
      if (notification.severity === 'CRITICAL') {
        toast.error(notification.message);
      }
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  return socketRef;
}
