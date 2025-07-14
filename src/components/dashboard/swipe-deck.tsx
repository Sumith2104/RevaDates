
'use client';

import * as React from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from 'framer-motion';
import type { UserProfile } from '@/lib/types';
import Image from 'next/image';
import { Heart, X, Undo2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { handleSwipeAction } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';

// New sub-component for handling the card animation logic
function AnimatedCard({ children, onSwipe, sensitivity = 100 }: { children: React.ReactNode, onSwipe: (direction: 'left' | 'right') => void, sensitivity?: number }) {
  const x = useMotionValue(0);
  const rotateY = useTransform(x, [-200, 200], [-60, 60]);
  const likeOpacity = useTransform(x, [0, 100], [0, 1]);
  const rejectOpacity = useTransform(x, [0, -100], [0, 1]);

  function handleDragEnd(_: any, info: { offset: { x: number }, velocity: { x: number } }) {
    if (Math.abs(info.offset.x) > sensitivity) {
      if (info.offset.x > 0) {
        onSwipe('right');
      } else {
        onSwipe('left');
      }
    } else {
      animate(x, 0, { type: "spring", stiffness: 300, damping: 30 });
    }
  }

  return (
    <motion.div
      className="absolute inset-0 cursor-grab"
      style={{ x, rotateY }}
      drag="x"
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={0.6}
      whileTap={{ cursor: "grabbing" }}
      onDragEnd={handleDragEnd}
      exit={{
        x: x.get() > 0 ? '100vw' : '-100vw',
        opacity: 0,
        transition: { duration: 0.3 }
      }}
    >
        {/* Container for the card content and the feedback icons */}
        <div className="relative w-full h-full">
            {/* Feedback Icons */}
            <motion.div style={{ opacity: likeOpacity }} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-green-400 pointer-events-none">
                <Heart className="h-32 w-32" fill="currentColor" />
            </motion.div>
            <motion.div style={{ opacity: rejectOpacity }} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-destructive pointer-events-none">
                <X className="h-32 w-32" />
            </motion.div>
            
            {/* Card Content passed as children */}
            {children}
        </div>
    </motion.div>
  );
}


interface SwipeDeckProps {
  users: UserProfile[];
  currentUserId: string;
}

export function SwipeDeck({ users: initialUsers, currentUserId }: SwipeDeckProps) {
  const [users, setUsers] = React.useState(initialUsers);
  const [history, setHistory] = React.useState<UserProfile[]>([]);
  const { toast } = useToast();

  const activeIndex = users.length - 1;
  const activeUser = users[activeIndex];
  
  const handleSwipe = async (swipeDirection: 'left' | 'right') => {
    if (activeIndex < 0) return;

    const swipedUser = users[activeIndex];
    const action = swipeDirection === 'right' ? 'liked' : 'rejected';

    // Optimistically update UI
    setHistory(prev => [users[activeIndex], ...prev]);
    setUsers(prev => prev.slice(0, prev.length - 1));

    const result = await handleSwipeAction(currentUserId, swipedUser.id, action);
    if (result.error) {
       toast({
        variant: "destructive",
        title: "Something went wrong",
        description: result.error,
       });
       // Revert UI change on error
       setUsers(initialUsers);
       setHistory(prev => prev.slice(1));
       return;
    }

    if (result.match) {
        toast({
            title: "It's a Match! 🎉",
            description: `You and ${swipedUser.name} have liked each other.`,
        });
    }
  };
  
  const handleUndo = () => {
    // Note: A true undo would require reverting the database action.
    // This is a UI-only undo for now.
    if (history.length > 0) {
      const lastUser = history[0];
      setHistory(prev => prev.slice(1));
      setUsers(prev => [...prev, lastUser]);
    }
  };

  const triggerSwipe = (direction: 'left' | 'right') => {
    handleSwipe(direction);
  };

  React.useEffect(() => {
    setUsers(initialUsers);
  }, [initialUsers]);


  return (
    <div className="flex-1 flex flex-col items-center justify-center w-full max-w-sm mx-auto p-4 gap-4 overflow-hidden">
      <div className="relative w-full aspect-[3/4]" style={{ perspective: 800 }}>
        <AnimatePresence>
          {activeUser ? (
            <AnimatedCard
              key={activeUser.id}
              onSwipe={handleSwipe}
            >
              <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-2xl bg-card">
                <Image
                  src={activeUser.photos && activeUser.photos.length > 0 ? activeUser.photos[0] : `https://placehold.co/600x800`}
                  alt={activeUser.name}
                  fill
                  priority
                  className="object-cover pointer-events-none"
                  data-ai-hint="person portrait"
                />
                <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-black/80 to-transparent p-6 flex flex-col justify-end">
                  <h2 className="text-3xl font-bold text-white">{activeUser.name}, {activeUser.age}</h2>
                  <p className="text-white/90 mt-1 line-clamp-2">{activeUser.bio}</p>
                  <p className="text-white/70 text-sm mt-2">{activeUser.distance} miles away</p>
                </div>
              </div>
            </AnimatedCard>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                <p className="text-xl font-medium">No more profiles to show.</p>
                <p className="mt-2">Check back later or adjust your filters.</p>
            </div>
          )}
        </AnimatePresence>
      </div>
      <div className="flex items-center justify-center gap-4">
        <Button onClick={() => triggerSwipe('left')} variant="outline" size="icon" className="h-16 w-16 rounded-full text-destructive hover:bg-destructive/10" disabled={!activeUser}>
          <X className="h-8 w-8" />
        </Button>
        <Button onClick={handleUndo} variant="outline" size="icon" disabled={history.length === 0} className="h-12 w-12 rounded-full border-yellow-500 text-yellow-500 hover:bg-yellow-500/10 disabled:opacity-50">
          <Undo2 className="h-6 w-6" />
        </Button>
        <Button onClick={() => triggerSwipe('right')} variant="outline" size="icon" className="h-16 w-16 rounded-full border-green-500 text-green-500 hover:bg-green-500/10" disabled={!activeUser}>
          <Heart className="h-8 w-8 fill-green-500" />
        </Button>
      </div>
    </div>
  );
}
