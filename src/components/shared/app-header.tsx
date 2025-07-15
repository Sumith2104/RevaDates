'use client';

import Link from 'next/link';
import { Heart, User, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function AppHeader() {
  return (
    <header className="fixed top-0 left-0 right-0 z-20 bg-background/80 backdrop-blur-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/dashboard" className="flex items-center gap-2 font-bold text-lg">
          <Heart className="h-6 w-6 text-primary" />
          <span>RevaDates</span>
        </Link>
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="icon">
            <Link href="#">
              <Bell className="h-6 w-6" />
              <span className="sr-only">Notifications</span>
            </Link>
          </Button>
          <Button asChild variant="ghost" size="icon">
            <Link href="/profile">
              <User className="h-6 w-6" />
              <span className="sr-only">Profile</span>
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
