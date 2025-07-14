
'use client';

import * as React from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from 'framer-motion';
import type { UserProfile } from '@/lib/types';
import Image from 'next/image';
import { Heart, X, Undo2, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { handleSwipeAction, handleUndoSwipeAction } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';

interface AnimatedCardProps {
  children: React.ReactNode;
  onSwipe: (direction: 'left' | 'right') => void;
  sensitivity?: number;
  swipeTrigger?: 'left' | 'right' | null;
  onSwipeComplete?: () => void;
}

function AnimatedCard({
  children,
  onSwipe,
  sensitivity = 100,
  swipeTrigger = null,
  onSwipeComplete,
}: AnimatedCardProps) {
  const x = useMotionValue(0);
  const rotateY = useTransform(x, [-200, 200], [-60, 60]);
  const likeOpacity = useTransform(x, [0, 100], [0, 1]);
  const rejectOpacity = useTransform(x, [0, -100], [0, 1]);

  React.useEffect(() => {
    if (!swipeTrigger) return;
    onSwipe(swipeTrigger);
    if (onSwipeComplete) {
      onSwipeComplete();
    }
  // The dependency array is intentionally limited to swipeTrigger to only react to button clicks.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [swipeTrigger]);

  function handleDragEnd(_: any, info: { offset: { x: number } }) {
    if (Math.abs(info.offset.x) > sensitivity) {
      const direction = info.offset.x > 0 ? 'right' : 'left';
      onSwipe(direction);
    } else {
      animate(x, 0, { type: 'spring', stiffness: 300, damping: 30 });
    }
  }
  
  return (
    <motion.div
      className="absolute inset-0 cursor-grab"
      style={{ x, rotateY }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.6}
      whileTap={{ cursor: 'grabbing' }}
      onDragEnd={handleDragEnd}
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1, transition: { duration: 0.3 } }}
      exit={{ 
        x: (x.getVelocity() > 0 ? 1 : -1) * 500,
        opacity: 0,
        scale: 0.9,
        transition: { duration: 0.3 } 
      }}
    >
      <div className="relative w-full h-full">
        <motion.div
          style={{ opacity: likeOpacity }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-green-400 pointer-events-none"
        >
          <Heart className="h-32 w-32" fill="currentColor" />
        </motion.div>
        <motion.div
          style={{ opacity: rejectOpacity }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-destructive pointer-events-none"
        >
          <X className="h-32 w-32" />
        </motion.div>

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
  const [swipeTrigger, setSwipeTrigger] = React.useState<'left' | 'right' | null>(null);
  const [isUndoing, setIsUndoing] = React.useState(false);
  const { toast } = useToast();

  const activeIndex = users.length - 1;
  const activeUser = users[activeIndex];
  
  const handleSwipe = async (direction: 'left' | 'right') => {
    if (activeIndex < 0) return;

    const swipedUser = users[activeIndex];
    const action = direction === 'right' ? 'liked' : 'rejected';

    setHistory(prev => [swipedUser, ...prev]);
    setUsers(prev => prev.slice(0, -1));
    setSwipeTrigger(null);

    const result = await handleSwipeAction(currentUserId, swipedUser.id, action);
    if (result.error) {
       toast({
        variant: "destructive",
        title: "Something went wrong",
        description: result.error,
       });
       // Revert state on error
       setUsers(prev => [swipedUser, ...prev]);
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
  
  const handleUndo = async () => {
    if (history.length === 0 || isUndoing) return;

    setIsUndoing(true);
    const lastUser = history[0];
    const result = await handleUndoSwipeAction(currentUserId, lastUser.id);
    
    if (result.error) {
      toast({
        variant: "destructive",
        title: "Undo failed",
        description: result.error,
      });
    } else {
      setHistory(prev => prev.slice(1));
      setUsers(prev => [...prev, lastUser]);
    }
    setIsUndoing(false);
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
              swipeTrigger={swipeTrigger}
              onSwipeComplete={() => setSwipeTrigger(null)}
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
                  <div className="flex justify-between items-center">
                    <h2 className="text-3xl font-bold text-white">{activeUser.name}, {activeUser.age}</h2>
                    <Button variant="ghost" size="icon" className="text-white bg-white/10 backdrop-blur-sm rounded-full hover:bg-white/20">
                      <MessageSquare className="h-6 w-6" />
                      <span className="sr-only">Chat</span>
                    </Button>
                  </div>
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
        <Button onClick={() => setSwipeTrigger('left')} variant="outline" size="icon" className="h-16 w-16 rounded-full text-destructive hover:bg-destructive/10" disabled={!activeUser || swipeTrigger !== null}>
          <X className="h-8 w-8" />
        </Button>
        <Button onClick={handleUndo} variant="outline" size="icon" disabled={history.length === 0 || swipeTrigger !== null || isUndoing} className="h-12 w-12 rounded-full border-yellow-500 text-yellow-500 hover:bg-yellow-500/10 disabled:opacity-50">
          <Undo2 className="h-6 w-6" />
        </Button>
        <Button onClick={() => setSwipeTrigger('right')} variant="outline" size="icon" className="h-16 w-16 rounded-full border-green-500 text-green-500 hover:bg-green-500/10" disabled={!activeUser || swipeTrigger !== null}>
          <Heart className="h-8 w-8 fill-green-500" />
        </Button>
      </div>
    </div>
  );
}
