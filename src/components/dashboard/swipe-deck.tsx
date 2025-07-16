
'use client';

import * as React from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from 'framer-motion';
import type { UserProfile } from '@/lib/types';
import Link from 'next/link';
import Image from 'next/image';
import { Heart, X, Undo2, MessageSquare, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { handleSwipeAction, handleUndoSwipeAction, blockUser } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"


interface AnimatedCardProps {
  children: React.ReactNode;
  onSwipe: (direction: 'left' | 'right') => void;
  onTap?: () => void;
  triggerSwipeDirection: 'left' | 'right' | null;
  setTriggerSwipeDirection: (val: 'left' | 'right' | null) => void;
}

function AnimatedCard({
  children,
  onSwipe,
  onTap,
  triggerSwipeDirection,
  setTriggerSwipeDirection,
}: AnimatedCardProps) {
  const x = useMotionValue(0);
  const y = useMotionValue(0); // Lock Y axis
  const rotateY = useTransform(x, [-200, 200], [-60, 60]);

  const likeOpacity = useTransform(x, [50, 120], [0, 1]);
  const passOpacity = useTransform(x, [-120, -50], [1, 0]);

  const isSwiping = React.useRef(false);

  const handleDragEnd = (_: any, info: { offset: { x: number } }) => {
    if (isSwiping.current || triggerSwipeDirection) return;

    if (Math.abs(info.offset.x) > 100) {
      const direction = info.offset.x > 0 ? 'right' : 'left';
      isSwiping.current = true;
      animate(x, direction === 'right' ? 500 : -500, {
        duration: 0.5,
        ease: 'easeInOut',
        onComplete: () => {
          onSwipe(direction);
        },
      });
    } else {
      // Snap back
      animate(x, 0, { type: 'spring', stiffness: 300, damping: 30 });
      animate(y, 0, { type: 'spring', stiffness: 300, damping: 30 });
    }
  };

  React.useEffect(() => {
    if (!triggerSwipeDirection) return;

    isSwiping.current = true;
    animate(x, triggerSwipeDirection === 'right' ? 500 : -500, {
      duration: 0.5,
      ease: 'easeInOut',
      onComplete: () => {
        onSwipe(triggerSwipeDirection);
        setTriggerSwipeDirection(null);
        isSwiping.current = false;
      },
    });
  }, [triggerSwipeDirection, onSwipe, setTriggerSwipeDirection, x]);

  return (
    <motion.div
      className="absolute inset-0 cursor-grab"
      style={{ x, y, rotateY }}
      drag="x" // Lock drag to horizontal only
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.5}
      whileTap={{ cursor: 'grabbing' }}
      onDragEnd={handleDragEnd}
      onTap={onTap}
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1, transition: { duration: 0.5, ease: 'easeInOut' } }}
    >
      <div className="relative w-full h-full">
        {/* LIKE Overlay */}
        <motion.div
          style={{ opacity: likeOpacity }}
          className="absolute top-6 left-6 bg-white/90 text-green-600 border-2 border-green-500 px-4 py-2 rounded-lg font-bold text-xl shadow pointer-events-none rotate-[-10deg] z-10 flex items-center gap-2"
        >
          DATE <Heart className="h-5 w-5 fill-current" />
        </motion.div>

        {/* PASS Overlay */}
        <motion.div
          style={{ opacity: passOpacity }}
          className="absolute top-6 right-6 bg-white/90 text-red-600 border-2 border-red-500 px-4 py-2 rounded-lg font-bold text-xl shadow pointer-events-none rotate-[10deg] z-10 flex items-center gap-2"
        >
          PASS <X className="h-5 w-5" />
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
  const [isUndoing, setIsUndoing] = React.useState(false);
  const [isBioVisible, setIsBioVisible] = React.useState(false);
  const [triggerSwipeDirection, setTriggerSwipeDirection] = React.useState<'left' | 'right' | null>(null);
  const [isBlockConfirmOpen, setIsBlockConfirmOpen] = React.useState(false);
  const { toast } = useToast();

  const activeIndex = users.length - 1;
  const activeUser = users[activeIndex];
  
  const handleSwipe = async (direction: 'left' | 'right') => {
    if (activeIndex < 0) return;
    
    setIsBioVisible(false);
    const swipedUser = users[activeIndex];
    const action = direction === 'right' ? 'liked' : 'rejected';

    setHistory(prev => [swipedUser, ...prev]);
    // State update now happens after animation in onSwipe callback
    setUsers(prev => prev.slice(0, -1));

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

    setIsBioVisible(false);
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
  
  const handleBlock = async () => {
    if (!activeUser) return;

    const result = await blockUser(currentUserId, activeUser.id);
    if (result.error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: result.error,
      });
    } else {
      toast({
        title: 'User Blocked',
        description: `You will no longer see ${activeUser.name}'s profile.`,
      });
      // Remove from deck immediately
      setUsers(prev => prev.slice(0, -1));
    }
    setIsBlockConfirmOpen(false);
  }

  const triggerSwipe = (direction: 'left' | 'right') => {
    if (!activeUser) return;
    setTriggerSwipeDirection(direction);
  }

  React.useEffect(() => {
    setUsers(initialUsers);
    setIsBioVisible(false);
  }, [initialUsers]);

  React.useEffect(() => {
    // Reset bio visibility when the active user changes
    setIsBioVisible(false);
  }, [activeUser?.id]);
  
  const formatDistance = (distanceInMeters: number | null) => {
    if (distanceInMeters === null) return null;
    if (distanceInMeters < 1000) {
      return `${distanceInMeters} meters away`;
    }
    const distanceInKm = (distanceInMeters / 1000).toFixed(1);
    return `${distanceInKm} km away`;
  };
  
  return (
    <>
      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-sm mx-auto p-4 gap-4 overflow-hidden">
        <div className="relative w-full aspect-[3/4]" style={{ perspective: 800 }}>
          {activeUser ? (
            <AnimatedCard
              key={activeUser.id}
              onSwipe={handleSwipe}
              onTap={() => setIsBioVisible(v => !v)}
              triggerSwipeDirection={triggerSwipeDirection}
              setTriggerSwipeDirection={setTriggerSwipeDirection}
            >
              <div className="relative w-full h-full rounded-lg overflow-hidden shadow-2xl bg-card">
                 <Avatar className="w-full h-full rounded-lg">
                    <AvatarImage 
                        src={activeUser.photos && activeUser.photos.length > 0 ? activeUser.photos[0] : ''} 
                        alt={activeUser.name}
                        className="object-cover w-full h-full"
                    />
                    <AvatarFallback className="w-full h-full rounded-lg bg-muted text-6xl font-bold flex items-center justify-center">
                        {getInitials(activeUser.name)}
                    </AvatarFallback>
                </Avatar>
                <motion.div 
                    className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 flex flex-col justify-end"
                    initial={{ height: '33.33%' }}
                    animate={{ height: isBioVisible ? '66.66%' : '33.33%' }}
                    transition={{ type: 'tween', duration: 0.5, ease: 'easeInOut' }}
                >
                  <div className="flex justify-between items-center">
                    <h2 className="text-3xl font-bold text-white">{activeUser.name}, {activeUser.age}</h2>
                    <div className="flex items-center gap-2">
                        <Button 
                            asChild 
                            variant="ghost" 
                            size="icon" 
                            className="text-white bg-white/10 backdrop-blur-sm rounded-full hover:bg-white/20"
                        >
                            <Link href="/chats" onClick={(e) => e.stopPropagation()}>
                                <MessageSquare className="h-6 w-6" />
                                <span className="sr-only">Chat</span>
                            </Link>
                        </Button>
                        <Button 
                            variant="ghost"
                            size="icon"
                            className="text-white bg-white/10 backdrop-blur-sm rounded-full hover:bg-white/20"
                            onClick={(e) => { e.stopPropagation(); setIsBlockConfirmOpen(true); }}
                         >
                            <ShieldAlert className="h-6 w-6" />
                            <span className="sr-only">Block and Report</span>
                        </Button>
                    </div>
                  </div>
                  <AnimatePresence>
                    {isBioVisible && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0, transition: { delay: 0.2, duration: 0.4 } }}
                            exit={{ opacity: 0, y: 10, transition: { duration: 0.2 } }}
                            className="overflow-hidden"
                        >
                            <p className="text-white/90 mt-2 text-base">{activeUser.bio}</p>
                        </motion.div>
                    )}
                  </AnimatePresence>
                  {activeUser.distance !== null && (
                      <p className="text-white/70 text-sm mt-2">{formatDistance(activeUser.distance_meters)}</p>
                  )}
                </motion.div>
              </div>
            </AnimatedCard>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                <p className="text-xl font-medium">No more profiles to show.</p>
                <p className="mt-2">Check back later or adjust your filters.</p>
            </div>
          )}
        </div>
        <div className="flex items-center justify-center gap-4">
          <Button onClick={() => triggerSwipe('left')} variant="outline" size="icon" className="h-12 w-12 rounded-full text-destructive hover:bg-destructive/10" disabled={!activeUser || !!triggerSwipeDirection}>
            <X className="h-6 w-6" />
          </Button>
          <Button onClick={handleUndo} variant="outline" size="icon" disabled={history.length === 0 || isUndoing || !!triggerSwipeDirection} className="h-10 w-10 rounded-full border-yellow-500 text-yellow-500 hover:bg-yellow-500/10 disabled:opacity-50">
            <Undo2 className="h-5 w-5" />
          </Button>
          <Button onClick={() => triggerSwipe('right')} variant="outline" size="icon" className="h-12 w-12 rounded-full border-green-500 text-green-500 hover:bg-green-500/10" disabled={!activeUser || !!triggerSwipeDirection}>
            <Heart className="h-6 w-6 fill-current text-green-500" />
          </Button>
        </div>

         {/* Preload the next 3 images */}
        <div style={{ display: 'none' }}>
          {users.slice(Math.max(0, activeIndex - 3), activeIndex).reverse().map(user => (
            user.photos && user.photos.length > 0 && (
              <Image
                key={`preload-${user.id}`}
                src={user.photos[0]}
                alt={`Preload ${user.name}`}
                width={600}
                height={800}
                priority
              />
            )
          ))}
        </div>
      </div>
      {activeUser && (
        <AlertDialog open={isBlockConfirmOpen} onOpenChange={setIsBlockConfirmOpen}>
            <AlertDialogContent className="w-full max-w-[320px] rounded-xl p-6 text-center shadow-2xl bg-white/10 backdrop-blur-lg border border-white/20">
                <AlertDialogHeader className="text-center sm:text-center">
                    <AlertDialogTitle className="text-white text-lg font-semibold">Block {activeUser.name}?</AlertDialogTitle>
                    <AlertDialogDescription className="text-sm text-white/70 mt-2">
                        Are you sure you want to block this user?
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="mt-6 flex flex-row sm:justify-center justify-center gap-4">
                    <AlertDialogAction onClick={handleBlock} className="w-28 bg-red-700 hover:bg-red-800 text-white px-6 py-2 rounded-full shadow-md">Block</AlertDialogAction>
                    <AlertDialogCancel onClick={() => setIsBlockConfirmOpen(false)} className="w-28 bg-white hover:bg-gray-100 text-black px-6 py-2 rounded-full shadow-md mt-0">Cancel</AlertDialogCancel>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
}

    