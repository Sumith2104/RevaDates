
'use client';

import Link from 'next/link';
import * as React from 'react';
import { Button } from '@/components/ui/button';
import { LandingHeader } from './landing-header';

const phrases = [
  "Get Naked Now",
  "Enter the Nude Zone",
  "Reveal Your True Self",
  "Join the Bare Side",
  "Strip Down Today",
  "Uncover and Connect",
  "Start Nude Adventures",
  "Show It All",
  "No Clothes, No Rules",
  "Dive Into Nudity"
];

const TYPING_SPEED = 50;

export function Hero() {
  const [activePhrase, setActivePhrase] = React.useState('');
  const [typedPhrase, setTypedPhrase] = React.useState('');

  React.useEffect(() => {
    // Select a random phrase on component mount
    setActivePhrase(phrases[Math.floor(Math.random() * phrases.length)]);
  }, []);

  React.useEffect(() => {
    if (!activePhrase) return;

    if (typedPhrase.length < activePhrase.length) {
      const timeoutId = setTimeout(() => {
        setTypedPhrase(activePhrase.slice(0, typedPhrase.length + 1));
      }, TYPING_SPEED);
      return () => clearTimeout(timeoutId);
    }
  }, [typedPhrase, activePhrase]);
  
  return (
    <div className="flex h-screen w-full items-center justify-center bg-black">
      <LandingHeader />
      <div className="absolute inset-0 -z-10 h-full w-full bg-background bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]">
        <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-primary/5 blur-[100px]"></div>
      </div>
      <div className="container mx-auto flex flex-col items-center justify-center text-center px-4">
        <h2 className="text-4xl font-bold tracking-tight text-neutral-200 mb-4">Get started</h2>
        <div className="flex flex-row gap-4">
          <Button asChild size="lg" className="font-semibold rounded-full text-white bg-white/10 backdrop-blur-md hover:bg-white/20">
            <Link href="/signup">Sign up</Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="font-semibold rounded-full bg-white/10 backdrop-blur-md hover:bg-white/20">
            <Link href="/login">Login</Link>
          </Button>
        </div>
        <div className="mt-8 max-w-2xl h-24 flex items-center justify-center">
          <p className="text-lg text-neutral-300">
            {typedPhrase}
            <span className="animate-pulse">|</span>
          </p>
        </div>
      </div>
    </div>
  );
}
