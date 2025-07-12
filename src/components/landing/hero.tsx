'use client';

import Link from 'next/link';
import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Heart } from 'lucide-react';
import { LandingHeader } from './landing-header';

const quotes = [
  "The best thing to hold onto in life is each other.",
  "You know you're in love when you can't fall asleep because reality is finally better than your dreams.",
  "Love is composed of a single soul inhabiting two bodies.",
  "To love and be loved is to feel the sun from both sides.",
  "In the arithmetic of love, one plus one equals everything, and two minus one equals nothing."
];

const TYPING_SPEED = 50;
const DELETING_SPEED = 30;
const PAUSE_DURATION = 1000; // Pause after typing, before deleting

export function Hero() {
  const [quoteIndex, setQuoteIndex] = React.useState(0);
  const [typedQuote, setTypedQuote] = React.useState('');
  const [isDeleting, setIsDeleting] = React.useState(false);

  React.useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const handleTyping = () => {
      const currentQuote = quotes[quoteIndex];
      if (isDeleting) {
        if (typedQuote.length > 0) {
          setTypedQuote((prev) => prev.slice(0, -1));
        } else {
          setIsDeleting(false);
          setQuoteIndex((prev) => (prev + 1) % quotes.length);
        }
      } else {
        if (typedQuote.length < currentQuote.length) {
          setTypedQuote((prev) => currentQuote.slice(0, prev.length + 1));
        } else {
          timeoutId = setTimeout(() => setIsDeleting(true), PAUSE_DURATION);
        }
      }
    };

    const typingInterval = setInterval(handleTyping, isDeleting ? DELETING_SPEED : TYPING_SPEED);

    return () => {
      clearInterval(typingInterval);
      clearTimeout(timeoutId);
    };
  }, [typedQuote, isDeleting, quoteIndex]);
  
  return (
    <div className="flex h-screen w-full items-center justify-center bg-black">
      <LandingHeader />
      <div className="absolute inset-0 -z-10 h-full w-full bg-background bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]">
        <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-primary/5 blur-[100px]"></div>
      </div>
      <div className="container mx-auto flex flex-col items-center justify-center text-center px-4">
        <div className="mt-2 max-w-2xl h-24 flex items-center justify-center">
          <p className="text-lg text-neutral-300">
            {typedQuote}
            <span className="animate-pulse">|</span>
          </p>
        </div>
        <div className="mt-8 flex flex-row gap-4">
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
