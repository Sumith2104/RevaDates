'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Heart } from 'lucide-react';

export function Hero() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-black">
      <div className="absolute inset-0 -z-10 h-full w-full bg-background bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]">
        <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-primary/5 blur-[100px]"></div>
      </div>
      <div className="container mx-auto flex flex-col items-center justify-center text-center px-4">
        <div className="mb-6 flex items-center justify-center gap-4">
          <Heart className="h-12 w-12 text-primary" />
          <h1 className="text-5xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-neutral-50 to-neutral-400">
            MatchMake AI
          </h1>
        </div>
        <p className="mt-2 max-w-2xl text-lg text-neutral-300">
          Discover meaningful connections with a little help from AI.
          <br />
          Your journey to finding 'the one' starts here.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-4">
          <Button asChild size="lg" className="font-semibold">
            <Link href="/signup">Get Started</Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="font-semibold">
            <Link href="/login">I have an account</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
