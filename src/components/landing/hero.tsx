'use client';

import Link from 'next/link';
import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Heart } from 'lucide-react';

const quotes = [
  "The best thing to hold onto in life is each other.",
  "You know you're in love when you can't fall asleep because reality is finally better than your dreams.",
  "Love is composed of a single soul inhabiting two bodies.",
  "To love and be loved is to feel the sun from both sides.",
  "In the arithmetic of love, one plus one equals everything, and two minus one equals nothing."
];

export function Hero() {
  const glassButtonClasses = "bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20";
  const [quoteIndex, setQuoteIndex] = React.useState(0);
  const [typedQuote, setTypedQuote] = React.useState('');

  React.useEffect(() => {
    const quoteRotationInterval = setInterval(() => {
      setQuoteIndex((prevIndex) => (prevIndex + 1) % quotes.length);
    }, 5000); // Change quote every 5 seconds

    return () => clearInterval(quoteRotationInterval);
  }, []);

  React.useEffect(() => {
    setTypedQuote(''); // Reset for new quote
    let currentText = '';
    let charIndex = 0;
    const typingInterval = setInterval(() => {
      if (charIndex < quotes[quoteIndex].length) {
        currentText += quotes[quoteIndex][charIndex];
        setTypedQuote(currentText);
        charIndex++;
      } else {
        clearInterval(typingInterval);
      }
    }, 50); // Typing speed

    return () => clearInterval(typingInterval);
  }, [quoteIndex]);
  
  return (
    <div className="flex h-screen w-full items-center justify-center bg-black">
      <div className="absolute inset-0 -z-10 h-full w-full bg-background bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]">
        <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-primary/5 blur-[100px]"></div>
      </div>
      <div className="container mx-auto flex flex-col items-center justify-center text-center px-4">
        <div className="mb-6 flex items-center justify-center gap-4">
          <Heart className="h-12 w-12 text-primary" />
          <h1 className="text-5xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-neutral-50 to-neutral-400">
            RevaDates
          </h1>
        </div>
        <div className="mt-2 max-w-2xl h-24 flex items-center justify-center">
          <p className="text-lg text-neutral-300">
            {typedQuote}
            <span className="animate-pulse">|</span>
          </p>
        </div>
        <div className="mt-8 flex flex-row gap-4">
          <Button asChild size="lg" className={`font-semibold rounded-full text-white ${glassButtonClasses}`}>
            <Link href="/signup">Sign up</Link>
          </Button>
          <Button asChild size="lg" variant="outline" className={`font-semibold rounded-full ${glassButtonClasses}`}>
            <Link href="/login">Login</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
