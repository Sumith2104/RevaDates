
'use client';

import * as React from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from 'framer-motion';
import type { UserProfile } from '@/lib/types';
import Link from 'next/link';
import Image from 'next/image';
import { Heart, X, Undo2, ShieldAlert, RefreshCcw, MapPin, Eye, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { handleSwipeAction, blockUser } from '@/lib/actions';
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
  const y = useMotionValue(0); 
  const rotate = useTransform(x, [-200, 200], [-25, 25]);
  const scale = useTransform(x, [-200, 0, 200], [0.95, 1, 0.95]);

  const likeOpacity = useTransform(x, [50, 120], [0, 1]);
  const passOpacity = useTransform(x, [-120, -50], [1, 0]);

  const isSwiping = React.useRef(false);

  const handleDragEnd = (_: any, info: { offset: { x: number }, velocity: { x: number } }) => {
    if (isSwiping.current || triggerSwipeDirection) return;

    const swipeThreshold = 100;
    const velocityThreshold = 500;

    if (Math.abs(info.offset.x) > swipeThreshold || Math.abs(info.velocity.x) > velocityThreshold) {
      const direction = info.offset.x > 0 ? 'right' : 'left';
      isSwiping.current = true;
      animate(x, direction === 'right' ? 600 : -600, {
        duration: 0.4,
        ease: [0.32, 0.72, 0, 1],
        onComplete: () => {
          onSwipe(direction);
        },
      });
      animate(y, -50, {
        duration: 0.4,
        ease: [0.32, 0.72, 0, 1],
      });
    } else {
      
      animate(x, 0, { type: 'spring', stiffness: 400, damping: 35 });
      animate(y, 0, { type: 'spring', stiffness: 400, damping: 35 });
    }
  };

  React.useEffect(() => {
    if (!triggerSwipeDirection) return;

    isSwiping.current = true;
    animate(x, triggerSwipeDirection === 'right' ? 600 : -600, {
      duration: 0.4,
      ease: [0.32, 0.72, 0, 1],
      onComplete: () => {
        onSwipe(triggerSwipeDirection);
        setTriggerSwipeDirection(null);
        isSwiping.current = false;
      },
    });
    animate(y, -50, {
      duration: 0.4,
      ease: [0.32, 0.72, 0, 1],
    });
  }, [triggerSwipeDirection, onSwipe, setTriggerSwipeDirection, x, y]);

  return (
    <motion.div
      className="absolute inset-0 cursor-grab"
      style={{ x, y, rotate, scale }}
      drag="x" 
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.7}
      whileTap={{ cursor: 'grabbing', scale: 0.98 }}
      onDragEnd={handleDragEnd}
      onTap={onTap}
      initial={{ scale: 0.8, opacity: 0, y: 50 }}
      animate={{ 
        scale: 1, 
        opacity: 1, 
        y: 0,
        transition: { 
          type: 'spring',
          stiffness: 300,
          damping: 25,
          mass: 0.8
        } 
      }}
      exit={{ 
        scale: 0.8, 
        opacity: 0,
        transition: { duration: 0.2 }
      }}
    >
      <div className="relative w-full h-full">
        
        <motion.div
          style={{ opacity: likeOpacity }}
          className="absolute top-8 right-8 px-6 py-3 rounded-2xl font-bold text-2xl bg-gradient-to-r from-green-400 to-emerald-500 text-white border-2 border-white/20 rotate-12 backdrop-blur-sm shadow-xl pointer-events-none z-10 flex items-center gap-2"
        >
          LIKE <Heart className="h-6 w-6 fill-white" />
        </motion.div>

        
        <motion.div
          style={{ opacity: passOpacity }}
          className="absolute top-8 left-8 px-6 py-3 rounded-2xl font-bold text-2xl bg-gradient-to-r from-red-400 to-pink-500 text-white border-2 border-white/20 -rotate-12 backdrop-blur-sm shadow-xl pointer-events-none z-10 flex items-center gap-2"
        >
          NOPE <X className="h-6 w-6" />
        </motion.div>

        {children}
      </div>
    </motion.div>
  );
}

function CardContent({ user, currentUserId, onBlock }: { user: UserProfile, currentUserId: string, onBlock: () => void }) {
    const [isBioVisible, setIsBioVisible] = React.useState(false);
    const [isBlockConfirmOpen, setIsBlockConfirmOpen] = React.useState(false);
    const { toast } = useToast();

    const handleBlock = async () => {
        const result = await blockUser(currentUserId, user.id);
        if (result.error) {
            toast({
                variant: 'destructive',
                title: 'Could Not Block User',
                description: result.error,
            });
        } else {
            toast({
                title: 'User Blocked',
                description: `You will no longer see ${user.name}'s profile.`,
            });
            onBlock(); 
        }
        setIsBlockConfirmOpen(false);
    }
    
    const hasPhoto = user?.photos && user.photos.length > 0;
    
    const formatDistance = (meters: number | null | undefined) => {
        if (meters === null || meters === undefined) return null;
        if (meters < 1000) {
            return `${Math.round(meters / 10) * 10} m away`;
        }
        return `${(meters / 1000).toFixed(1)} km away`;
    };
    
    const distanceString = formatDistance(user.distance_meters);

    const nameParts = user.name.split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ');

    return (
        <>
            <div className="relative w-full h-full rounded-lg overflow-hidden shadow-2xl bg-card" onClick={() => setIsBioVisible(v => !v)}>
                <div className="relative w-full h-full">
                    {hasPhoto ? (
                        <Image
                            src={user.photos[0]}
                            alt={user.name}
                            fill
                            className="object-cover"
                            priority
                        />
                    ) : (
                        <div className="w-full h-full rounded-lg bg-muted text-6xl font-bold flex items-center justify-center">
                            {getInitials(user.name)}
                        </div>
                    )}
                </div>
                <motion.div 
                    className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 flex flex-col justify-end"
                    initial={{ height: '33.33%' }}
                    animate={{ height: isBioVisible ? '66.66%' : '33.33%' }}
                    transition={{ type: 'tween', duration: 0.5, ease: 'easeInOut' }}
                >
                  <div className="flex justify-between items-start">
                    <h2 className="text-3xl font-bold text-white leading-tight">
                        {firstName}
                        {lastName && <br />}
                        {lastName}, {user.age}
                    </h2>
                    <div className="flex items-center gap-2">
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
                   {distanceString && (
                        <p className="text-white/80 text-sm flex items-center gap-1 mt-1">
                            <MapPin className="h-4 w-4" />
                            {distanceString}
                        </p>
                    )}
                  <AnimatePresence>
                    {isBioVisible && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0, transition: { delay: 0.2, duration: 0.4 } }}
                            exit={{ opacity: 0, y: 10, transition: { duration: 0.2 } }}
                            className="overflow-hidden"
                        >
                            <p className="text-white/90 mt-2 text-base">{user.bio}</p>
                        </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
            </div>
            <AlertDialog open={isBlockConfirmOpen} onOpenChange={setIsBlockConfirmOpen}>
                <AlertDialogContent className="w-full max-w-[330px] rounded-lg p-6 text-center shadow-2xl bg-white/10 backdrop-blur-lg">
                    <AlertDialogHeader className="text-center sm:text-center">
                        <AlertDialogTitle className="text-white text-lg font-semibold">Block {user.name}?</AlertDialogTitle>
                        <AlertDialogDescription className="text-sm text-white/70 mt-2">
                            Are you sure? You won't see their profile again and this cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-6 flex flex-row sm:justify-center justify-center gap-4">
                        <AlertDialogAction onClick={handleBlock} className="w-28 bg-red-700 hover:bg-red-800 text-white px-6 py-2 rounded-full shadow-md">Block</AlertDialogAction>
                        <AlertDialogCancel onClick={() => setIsBlockConfirmOpen(false)} className="w-28 bg-white hover:bg-gray-100 hover:text-black text-black px-6 py-2 rounded-full shadow-md mt-0">Cancel</AlertDialogCancel>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

interface SwipeDeckProps {
  users: UserProfile[];
  currentUserId: string;
  onSwipe: (swipedUser: UserProfile) => void;
  onRefresh: () => void;
  onUndo: () => void;
  canUndo: boolean;
}

export function SwipeDeck({ users: initialUsers, currentUserId, onSwipe, onRefresh, onUndo, canUndo }: SwipeDeckProps) {
  const [users, setUsers] = React.useState(initialUsers);
  const [triggerSwipeDirection, setTriggerSwipeDirection] = React.useState<'left' | 'right' | null>(null);
  const { toast } = useToast();
  
  const activeIndex = users.length - 1;
  const activeUser = users[activeIndex];

  const handleSwipe = async (direction: 'left' | 'right') => {
    if (activeIndex < 0) return;
    
    const swipedUser = users[activeIndex];
    const action = direction === 'right' ? 'liked' : 'rejected';

    
    onSwipe(swipedUser);
    
    
    

    const result = await handleSwipeAction(currentUserId, swipedUser.id, action);
    if (result.error) {
       toast({
        variant: "destructive",
        title: "Swipe Error",
        description: result.error,
       });
       
       
       
       onUndo(); 
       return;
    }

    if (result.match) {
        toast({
            title: "It's a Match! 🎉",
            description: `You and ${swipedUser.name} can now chat.`,
        });
    }
  };
  
  const triggerSwipe = (direction: 'left' | 'right') => {
    if (!activeUser) return;
    setTriggerSwipeDirection(direction);
  }

  React.useEffect(() => {
    setUsers(initialUsers);
  }, [initialUsers]);
  
  const handleBlockFromCard = () => {
    if (activeUser) {
        onSwipe(activeUser); 
    }
  }

  return (
    <>
      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-sm mx-auto p-4 gap-4 overflow-hidden">
        <div className="relative w-full aspect-[3/4]" style={{ perspective: 800 }}>
          <AnimatePresence>
          {activeUser ? (
            <AnimatedCard
              key={activeUser.id}
              onSwipe={handleSwipe}
              triggerSwipeDirection={triggerSwipeDirection}
              setTriggerSwipeDirection={setTriggerSwipeDirection}
            >
              <CardContent user={activeUser} currentUserId={currentUserId} onBlock={handleBlockFromCard} />
            </AnimatedCard>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                <p className="text-xl font-medium">No more profiles to show.</p>
                <p className="mt-2">Check back later or adjust your filters.</p>
            </div>
          )}
          </AnimatePresence>
        </div>
        <div className="flex flex-col items-center justify-center gap-4">
            <div className="flex items-center justify-center gap-6">
              <Button 
                onClick={() => triggerSwipe('left')} 
                size="icon" 
                className="h-20 w-20 rounded-full bg-gradient-to-br from-red-400 to-pink-500 hover:from-red-500 hover:to-pink-600 shadow-lg shadow-red-500/30 hover:shadow-2xl hover:shadow-red-500/50 transition-all duration-300 hover:scale-110 border-2 border-white/20 disabled:opacity-50 disabled:scale-100"
                disabled={!activeUser || !!triggerSwipeDirection}
              >
                <X className="h-10 w-10 text-white" />
              </Button>

              <Button 
                onClick={onUndo} 
                size="icon" 
                className="h-16 w-16 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 shadow-lg shadow-yellow-500/30 hover:shadow-xl hover:shadow-yellow-500/50 transition-all duration-300 hover:scale-110 border-2 border-white/20 disabled:opacity-30 disabled:scale-100"
                disabled={!canUndo || !!triggerSwipeDirection}
              >
                <Undo2 className="h-8 w-8 text-white" />
              </Button>
              
              <Button 
                onClick={() => triggerSwipe('right')} 
                size="icon" 
                className="h-20 w-20 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 hover:from-green-500 hover:to-emerald-600 shadow-lg shadow-green-500/30 hover:shadow-2xl hover:shadow-green-500/50 transition-all duration-300 hover:scale-110 border-2 border-white/20 disabled:opacity-50 disabled:scale-100"
                disabled={!activeUser || !!triggerSwipeDirection}
              >
                <Heart className="h-10 w-10 fill-white text-white" />
              </Button>
            </div>
            <Button 
              onClick={onRefresh} 
              size="icon" 
              className="h-14 w-14 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/30 text-white backdrop-blur-md transition-all duration-300 hover:scale-105"
              disabled={!!triggerSwipeDirection}
            >
                <RefreshCcw className="h-7 w-7" />
            </Button>
        </div>


         
        <div style={{ display: 'none' }}>
          {(() => {
            const seenIds = new Set<string>();
            return users.slice(Math.max(0, activeIndex - 3), activeIndex).reverse().map(user => {
              if (seenIds.has(user.id) || !user.photos || user.photos.length === 0) return null;
              seenIds.add(user.id);
              return (
                <Image
                  key={`preload-${user.id}`}
                  src={user.photos[0]}
                  alt={`Preload ${user.name}`}
                  width={600}
                  height={800}
                />
              );
            });
          })()}
        </div>
      </div>
    </>
  );
}
