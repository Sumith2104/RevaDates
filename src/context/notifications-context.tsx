
'use client';

import * as React from 'react';

type NotificationsContextType = {
  unreadChats: number;
  setUnreadChats: (count: number) => void;
  unreadNotifications: number;
  setUnreadNotifications: (count: number) => void;
};

const NotificationsContext = React.createContext<NotificationsContextType | undefined>(undefined);

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const [unreadChats, setUnreadChats] = React.useState(0);
  const [unreadNotifications, setUnreadNotifications] = React.useState(0);

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
