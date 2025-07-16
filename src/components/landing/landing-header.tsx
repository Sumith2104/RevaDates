
'use client';

import Link from 'next/link';
import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Heart } from 'lucide-react';
import { Dialog, DialogContent, DialogTrigger } from '../ui/dialog';
import { SignupForm } from '../auth/signup-form';
import { LoginForm } from '../auth/login-form';

export function LandingHeader() {
  const glassButtonClasses = "bg-white/10 backdrop-blur-md hover:bg-white/20";
  
  return (
    <header className="fixed top-0 left-0 right-0 z-20">
      <div className="container mx-auto flex h-20 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg">
          <Heart className="h-6 w-6 text-primary" />
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-neutral-50 to-neutral-400">
            RevaDates
          </span>
        </Link>
        <div className="flex flex-row gap-4">
          <Dialog>
            <DialogTrigger asChild>
              <Button size="lg" className={`font-semibold rounded-full text-white ${glassButtonClasses}`}>
                Sign up
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-transparent border-0 p-0 max-w-sm">
              <SignupForm />
            </DialogContent>
          </Dialog>

          <Dialog>
            <DialogTrigger asChild>
              <Button size="lg" variant="outline" className={`font-semibold rounded-full ${glassButtonClasses}`}>
                Login
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-transparent border-0 p-0 max-w-sm">
              <LoginForm />
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </header>
  );
}
