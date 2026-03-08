
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Heart, MessageSquare, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import * as React from 'react';
import { useNotifications } from '@/context/notifications-context';
import { useCurrentUser } from '@/hooks/use-current-user';

import { getUnreadCounts } from '@/lib/actions';

export function BottomNav() {
  const pathname = usePathname();
  const { user: currentUserId } = useCurrentUser();
  const { unreadChats, setUnreadChats, setUnreadNotifications } = useNotifications();

  React.useEffect(() => {
    if (!currentUserId) return;

    const oneTimeRefresh = async () => {
      const justLoggedIn = sessionStorage.getItem('justLoggedIn');
      if (justLoggedIn) {
        sessionStorage.removeItem('justLoggedIn');
        const counts = await getUnreadCounts(currentUserId);
        if (counts && !counts.error) {
          setUnreadChats(counts.unreadChatCount);
          setUnreadNotifications(counts.unreadNotificationCount);
        }
      }
    };
    oneTimeRefresh();

    let intervalId: NodeJS.Timeout;

    const pollUnreadCounts = async () => {
      if (pathname.startsWith('/chats/')) return;
      const counts = await getUnreadCounts(currentUserId);
      if (counts && !counts.error) {
        setUnreadChats(counts.unreadChatCount);
        setUnreadNotifications(counts.unreadNotificationCount);
      }
    };

    intervalId = setInterval(pollUnreadCounts, 10000);

    return () => clearInterval(intervalId);
  }, [currentUserId, setUnreadChats, pathname, setUnreadNotifications]);


  const navItems = [
    { href: '/dashboard', icon: Heart, label: 'Discover', getUnreadCount: () => 0 },
    { href: '/chats', icon: MessageSquare, label: 'Chats', getUnreadCount: () => unreadChats },
    { href: '/settings', icon: Settings, label: 'Settings', getUnreadCount: () => 0 },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black to-transparent pt-4 md:hidden">
      <nav className="container mx-auto grid grid-cols-3 h-16 items-center px-4">
        {navItems.map((item) => {
          const unreadCount = item.getUnreadCount();
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center justify-center text-foreground/70"
              aria-label={item.label}
            >
              <div className="relative">
                <item.icon
                  className={cn(
                    'h-7 w-7',
                    pathname.startsWith(item.href) ? 'text-primary fill-primary/20' : ''
                  )}
                />
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-white text-black text-xs font-bold translate-x-1/2 -translate-y-1/2">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
