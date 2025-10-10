
'use client';

import Link from 'next/link';
import * as React from 'react';
import { Heart, User, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNotifications } from '@/context/notifications-context';

export function AppHeader() {
  const { unreadNotifications } = useNotifications();

  return (
    <header className="fixed top-0 left-0 right-0 z-20 bg-black/80 backdrop-blur-xl border-b border-white/5">
      <div className="container mx-auto flex h-20 items-center justify-between px-6">
        <Link href="/dashboard" className="flex items-center gap-2 group">
          <Heart className="h-6 w-6 text-primary" />
          <span className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            RevaDates
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon" className="relative rounded-full hover:bg-white/10 transition-colors">
            <Link href="/notifications">
              <Bell className="h-6 w-6 text-white" />
              {unreadNotifications > 0 && (
                <span className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-red-400 to-pink-500 text-white text-xs font-bold shadow-lg shadow-pink-500/50 animate-pulse">
                  {unreadNotifications > 9 ? '9+' : unreadNotifications}
                </span>
              )}
              <span className="sr-only">Notifications</span>
            </Link>
          </Button>
          <Button asChild variant="ghost" size="icon" className="rounded-full hover:bg-white/10 transition-colors">
            <Link href="/profile">
              <User className="h-6 w-6 text-white" />
              <span className="sr-only">Profile</span>
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
