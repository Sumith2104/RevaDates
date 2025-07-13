'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Heart, User, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

export function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { href: '/dashboard', icon: Heart, label: 'Discover' },
    { href: '/profile', icon: User, label: 'Profile' },
    { href: '/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-border bg-background/80 backdrop-blur-sm md:hidden">
      <nav className="container mx-auto grid grid-cols-3 h-16 items-center px-4">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex flex-col items-center justify-center gap-1 text-xs text-foreground/70"
          >
            <item.icon
              className={cn(
                'h-6 w-6',
                pathname === item.href ? 'text-primary fill-primary/20' : ''
              )}
            />
            <span className={cn(pathname === item.href ? 'font-bold text-primary' : '')}>
              {item.label}
            </span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
