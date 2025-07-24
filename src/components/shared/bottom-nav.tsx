
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Heart, MessageSquare, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import * as React from 'react';
import { useNotifications } from '@/context/notifications-context';

export function BottomNav() {
  const pathname = usePathname();
  const { unreadChats } = useNotifications();

  const navItems = [
    { href: '/dashboard', icon: Heart, label: 'Discover', hasDot: false },
    { href: '/chats', icon: MessageSquare, label: 'Chats', hasDot: unreadChats > 0 },
    { href: '/settings', icon: Settings, label: 'Settings', hasDot: false },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black to-transparent pt-4 md:hidden">
      <nav className="container mx-auto grid grid-cols-3 h-16 items-center px-4">
        {navItems.map((item) => (
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
              {item.hasDot && (
                <span className="absolute top-0 right-0 flex h-2 w-2 items-center justify-center rounded-full bg-white" />
              )}
            </div>
          </Link>
        ))}
      </nav>
    </div>
  );
}
