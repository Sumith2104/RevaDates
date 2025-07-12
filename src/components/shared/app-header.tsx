'use client';

import Link from 'next/link';
import { Heart, User, Settings } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export function AppHeader() {
  const pathname = usePathname();

  const navItems = [
    { href: '/settings', icon: Settings, label: 'Settings' },
    { href: '/profile', icon: User, label: 'Profile' },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-20 bg-background/80 backdrop-blur-sm border-b border-border">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/dashboard" className="flex items-center gap-2 font-bold text-lg">
          <Heart className="h-6 w-6 text-primary" />
          <span>RevaDates</span>
        </Link>
        <nav className="hidden md:flex items-center gap-2">
          {navItems.map((item) => (
            <Button key={item.href} variant="ghost" size="icon" asChild>
                <Link href={item.href} aria-label={item.label}>
                    <item.icon className={cn('h-5 w-5', pathname === item.href ? 'text-primary' : 'text-foreground/60')} />
                </Link>
            </Button>
          ))}
        </nav>
      </div>
    </header>
  );
}
