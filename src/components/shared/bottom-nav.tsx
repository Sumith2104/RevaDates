
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Heart, MessageSquare, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

export function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { href: '/dashboard', icon: Heart, label: 'Discover' },
    { href: '/chats', icon: MessageSquare, label: 'Chats' },
    { href: '/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-border bg-background/80 backdrop-blur-sm md:hidden">
      <nav className="container mx-auto grid grid-cols-3 h-16 items-center px-4">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex flex-col items-center justify-center text-foreground/70"
            aria-label={item.label}
          >
            <item.icon
              className={cn(
                'h-7 w-7',
                pathname === item.href ? 'text-primary fill-primary/20' : ''
              )}
            />
          </Link>
        ))}
      </nav>
    </div>
  );
}
