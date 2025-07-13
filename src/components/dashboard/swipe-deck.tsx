'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserProfile } from '@/lib/types';
import Image from 'next/image';
import { Heart, X, Undo2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function SwipeDeck({ users: initialUsers }: { users: UserProfile[] }) {
  const [users, setUsers] = React.useState(initialUsers);
  const [history, setHistory] = React.useState<UserProfile[]>([]);
  const [direction, setDirection] = React.useState<'left' | 'right' | null>(null);

  const activeIndex = users.length - 1;
  const activeUser = users[activeIndex];

  const handleSwipe = (swipeDirection: 'left' | 'right') => {
    if (activeIndex < 0) return;
    setDirection(swipeDirection);
    setTimeout(() => {
        setHistory(prev => [users[activeIndex], ...prev]);
        setUsers(prev => prev.slice(0, prev.length - 1));
        setDirection(null);
    }, 300);
  };
  
  const handleUndo = () => {
    if (history.length > 0) {
      const lastUser = history[0];
      setHistory(prev => prev.slice(1));
      setUsers(prev => [lastUser, ...prev]);
    }
  };

  const swipeVariants = {
    hidden: (direction: 'left' | 'right') => ({
      x: direction === 'right' ? '100vw' : '-100vw',
      opacity: 0,
      rotate: direction === 'right' ? 30 : -30,
    }),
    visible: { x: 0, opacity: 1, rotate: 0, transition: { type: 'spring', stiffness: 100, damping: 20 } },
    exit: (direction: 'left' | 'right') => ({
      x: direction === 'right' ? '100vw' : '-100vw',
      opacity: 0,
      rotate: direction === 'right' ? 30 : -30,
      transition: { duration: 0.3 },
    }),
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center w-full max-w-sm mx-auto p-4 gap-4 overflow-hidden">
      <div className="relative w-full aspect-[3/4]">
        <AnimatePresence custom={direction}>
          {activeUser ? (
            <motion.div
              key={activeUser.id}
              custom={direction}
              variants={swipeVariants}
              initial="visible"
              animate="visible"
              exit="exit"
              className="absolute inset-0"
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.1}
              onDragEnd={(event, { offset, velocity }) => {
                const swipeThreshold = 80;
                if (offset.x < -swipeThreshold) {
                  handleSwipe('left');
                } else if (offset.x > swipeThreshold) {
                  handleSwipe('right');
                }
              }}
            >
              <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-2xl bg-card">
                <Image
                  src={activeUser.photos && activeUser.photos.length > 0 ? activeUser.photos[0] : `https://placehold.co/600x800`}
                  alt={activeUser.name}
                  fill
                  priority
                  className="object-cover"
                  data-ai-hint="person portrait"
                />
                <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-black/80 to-transparent p-6 flex flex-col justify-end">
                  <h2 className="text-3xl font-bold text-white">{activeUser.name}, {activeUser.age}</h2>
                  <p className="text-white/90 mt-1 line-clamp-2">{activeUser.bio}</p>
                  <p className="text-white/70 text-sm mt-2">{activeUser.distance} miles away</p>
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                <p className="text-xl font-medium">No more profiles to show.</p>
                <p className="mt-2">Check back later or adjust your filters.</p>
            </div>
          )}
        </AnimatePresence>
      </div>
      <div className="flex items-center justify-center gap-4">
        <Button onClick={() => handleSwipe('left')} variant="outline" size="icon" className="h-16 w-16 rounded-full text-destructive hover:bg-destructive/10">
          <X className="h-8 w-8" />
        </Button>
        <Button onClick={handleUndo} variant="outline" size="icon" disabled={history.length === 0} className="h-12 w-12 rounded-full border-yellow-500 text-yellow-500 hover:bg-yellow-500/10 disabled:opacity-50">
          <Undo2 className="h-6 w-6" />
        </Button>
        <Button onClick={() => handleSwipe('right')} variant="outline" size="icon" className="h-16 w-16 rounded-full border-green-500 text-green-500 hover:bg-green-500/10">
          <Heart className="h-8 w-8 fill-green-500" />
        </Button>
      </div>
    </div>
  );
}
