
'use client';

import Link from 'next/link';
import * as React from 'react';
import { Heart, User, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';

export function AppHeader() {
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [userId, setUserId] = React.useState<string | null>(null);

  React.useEffect(() => {
    const currentUserId = localStorage.getItem('currentUserId');
    setUserId(currentUserId);
  }, []);
  
  React.useEffect(() => {
    if (!userId) return;
    
    const supabase = createClient();

    const fetchInitialCount = async () => {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('recipient_id', userId)
        .eq('is_read', false);
      
      if (!error) {
        setUnreadCount(count || 0);
      }
    };
    
    fetchInitialCount();

    const channel = supabase.channel(`notifications:user_id=eq.${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_id=eq.${userId}`,
        },
        () => {
          fetchInitialCount();
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };

  }, [userId]);

  return (
    <header className="fixed top-0 left-0 right-0 z-20 bg-background/80 backdrop-blur-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/dashboard" className="flex items-center gap-2 font-bold text-lg">
          <Heart className="h-6 w-6 text-primary" />
          <span>RevaDates</span>
        </Link>
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="icon" className="relative">
            <Link href="/notifications">
              <Bell className="h-6 w-6" />
              {unreadCount > 0 && (
                 <span className="absolute top-2 right-2 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                 </span>
              )}
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
