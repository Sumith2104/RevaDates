
'use client';

import Link from 'next/link';
import * as React from 'react';
import { Button } from '@/components/ui/button';
import { LandingHeader } from './landing-header';

const phrases = [
  "Take It All Off",
  "Bare It All",
  "Show Some Skin",
  "Lose the Layers",
  "Drop Everything Now",
  "Reveal Your Body",
  "Strip Without Shame",
  "Go All Natural",
  "Nothing Left On",
  "Feel Fully Free"
];

const TYPING_SPEED = 50;

export function Hero() {
  const [activePhrase, setActivePhrase] = React.useState('');
  const [typedPhrase, setTypedPhrase] = React.useState('');
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [phraseIndex, setPhraseIndex] = React.useState(0);

  React.useEffect(() => {
    // Select a random phrase on component mount
    setActivePhrase(phrases[Math.floor(Math.random() * phrases.length)]);
  }, []);

   React.useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    if (isDeleting) {
      if (typedPhrase.length > 0) {
        timeoutId = setTimeout(() => {
          setTypedPhrase(typedPhrase.slice(0, -1));
        }, TYPING_SPEED / 2);
      } else {
        setIsDeleting(false);
        setPhraseIndex((prev) => (prev + 1) % phrases.length);
        setActivePhrase(phrases[(phraseIndex + 1) % phrases.length]);
      }
    } else {
      if (typedPhrase.length < activePhrase.length) {
        timeoutId = setTimeout(() => {
          setTypedPhrase(activePhrase.slice(0, typedPhrase.length + 1));
        }, TYPING_SPEED);
      } else {
        timeoutId = setTimeout(() => setIsDeleting(true), 5000);
      }
    }

    return () => clearTimeout(timeoutId);
  }, [typedPhrase, activePhrase, isDeleting, phraseIndex]);

  return (
    <div className="flex h-screen w-full items-center justify-center bg-black">
      <LandingHeader />
      <div className="absolute inset-0 -z-10 h-full w-full bg-background bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]">
        <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-primary/5 blur-[100px]"></div>
      </div>
      <div className="container mx-auto flex flex-col items-center justify-center text-center px-4">
        <h2 className="text-4xl font-bold tracking-tight text-neutral-200 mb-4">Get started</h2>
        <div className="mb-8 max-w-2xl h-8 flex items-center justify-center mt-2">
          <p className="text-lg text-neutral-300">
            {typedPhrase}
            <span className="animate-pulse">|</span>
          </p>
        </div>
        <div className="flex flex-row gap-4 mt-4">
          <Button asChild size="lg" className="font-semibold rounded-full text-white bg-white/10 backdrop-blur-md hover:bg-white/20">
            <Link href="/signup">Sign up</Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="font-semibold rounded-full bg-white/10 backdrop-blur-md hover:bg-white/20">
            <Link href="/login">Login</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
