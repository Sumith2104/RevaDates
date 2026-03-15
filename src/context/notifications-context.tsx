
'use client';

import * as React from 'react';
import { useUpdates } from './updates-context';
import { useCurrentUser } from '@/hooks/use-current-user';
import { getUnreadCounts } from '@/lib/actions';

type NotificationsContextType = {
  unreadChats: number;
  setUnreadChats: React.Dispatch<React.SetStateAction<number>>;
  unreadNotifications: number;
  setUnreadNotifications: React.Dispatch<React.SetStateAction<number>>;
};

const NotificationsContext = React.createContext<NotificationsContextType | undefined>(undefined);

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const [unreadChats, setUnreadChats] = React.useState(0);
  const [unreadNotifications, setUnreadNotifications] = React.useState(0);
  const { user: currentUserId } = useCurrentUser();
  const { subscribe } = useUpdates();

  const fetchCounts = React.useCallback(async () => {
    if (!currentUserId) return;
    const counts = await getUnreadCounts(currentUserId);
    if (counts && !counts.error) {
      setUnreadChats(counts.unreadChatCount);
      setUnreadNotifications(counts.unreadNotificationCount);
    }
  }, [currentUserId]);

  React.useEffect(() => {
    if (!currentUserId) return;

    fetchCounts();

    // Subscribe to all tables that affect unread counts
    const unsubscribeMessages = subscribe('messages', () => fetchCounts());
    const unsubscribeMatches = subscribe('matches', () => fetchCounts());
    const unsubscribeNotifications = subscribe('notifications', () => fetchCounts());

    return () => {
      unsubscribeMessages();
      unsubscribeMatches();
      unsubscribeNotifications();
    };
  }, [currentUserId, fetchCounts, subscribe]);

  const value = {
    unreadChats,
    setUnreadChats,
    unreadNotifications,
    setUnreadNotifications,
  };

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const context = React.useContext(NotificationsContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationsProvider');
  }
  return context;
}
