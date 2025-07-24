
'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { LoginForm } from './login-form';
import { SignupForm } from './signup-form';
import { ForgotPasswordForm } from './forgot-password-form';
import { Heart, MapPin, Loader2 } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { updateUserLocation } from '@/lib/actions';
import ScrollReveal from '@/components/shared/ScrollReveal';
import { LoginOptions } from './login-options';
import { createClient } from '@/lib/supabase/client';
import { PageLoader } from '../shared/page-loader';

const TYPING_SPEED = 100;
const phrases = [ "Take It All Off", "Bare It All", "Show Some Skin", "Thirsty For Water", "Lose the Layers", "Drop Everything Now", "Feel The Curve", "Reveal Your Body", "Strip Without Shame", "Go All Natural", "Nothing Left On", "Feel Fully Free" ];

function LocationPermissionPrompt({ onComplete, onAllow }: { onComplete: () => void; onAllow: () => Promise<void> }) {
    const [status, setStatus] = React.useState<'idle' | 'loading'>('idle');

    const handleAllow = async () => {
        setStatus('loading');
        await onAllow();
        setStatus('idle');
    };
    
    return (
        <AlertDialog open={true}>
            <AlertDialogContent className="w-full max-w-[330px] rounded-lg p-6 text-center shadow-2xl bg-white/10 backdrop-blur-lg">
                <AlertDialogHeader className="text-center sm:text-center">
                    <MapPin className="mx-auto h-12 w-12 text-primary mb-2" />
                    <AlertDialogTitle className="text-white text-lg font-semibold">Enable Location Services</AlertDialogTitle>
                    <AlertDialogDescription className="text-sm text-white/70 mt-2">
                        RevaDates uses your location to show you potential matches nearby.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="mt-6 flex flex-col sm:flex-col w-full gap-2">
                    <AlertDialogAction
                        onClick={handleAllow}
                        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2 rounded-full shadow-md"
                        disabled={status === 'loading'}
                    >
                         {status === 'loading' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Allow Location
                    </AlertDialogAction>
                    <AlertDialogCancel
                        onClick={onComplete}
                        className="w-full bg-white hover:bg-gray-100 hover:text-black text-black px-6 py-2 rounded-full shadow-md mt-0"
                    >
                        Maybe Later
                    </AlertDialogCancel>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}


export function AuthScreen() {
  const [view, setView] = React.useState<'start' | 'signup' | 'forgot-password' | 'location'>('start');
  const [isLoginOpen, setIsLoginOpen] = React.useState(false);
  const [typedPhrase, setTypedPhrase] = React.useState('');
  const [phraseIndex, setPhraseIndex] = React.useState(0);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const activePhrase = phrases[phraseIndex];
  const [checkingAuth, setCheckingAuth] = React.useState(true);
  const [postLogin, setPostLogin] = React.useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const aboutRef = React.useRef<HTMLDivElement | null>(null);
  const scrollToAbout = () => {
    aboutRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  React.useEffect(() => {
    const supabase = createClient();
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        localStorage.setItem('currentUserId', session.user.id);
        setPostLogin(true); // User is already logged in, show loader and redirect
        router.push('/dashboard');
      } else {
        setCheckingAuth(false);
      }
    };
    checkSession();
  }, [router]);

  React.useEffect(() => {
    const error = searchParams.get('error');
    if (error) {
        toast({
            variant: 'destructive',
            title: 'Authentication Error',
            description: error,
        });
        // Remove error from URL without reloading
        router.replace('/', {scroll: false});
    }
  }, [searchParams, toast, router]);


  React.useEffect(() => {
    if (checkingAuth || postLogin) return;
    let timeoutId: NodeJS.Timeout;

    if (isDeleting) {
      if (typedPhrase.length > 0) {
        timeoutId = setTimeout(() => {
          setTypedPhrase(typedPhrase.slice(0, -1));
        }, TYPING_SPEED / 2);
      } else {
        setIsDeleting(false);
        setPhraseIndex((prev) => (prev + 1) % phrases.length);
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
  }, [typedPhrase, activePhrase, isDeleting, checkingAuth, postLogin]);
  
  const handleLocationComplete = React.useCallback(() => {
      router.push('/dashboard');
  }, [router]);
  
  const attemptToGetLocation = React.useCallback(async (userId: string) => {
    return new Promise<void>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
            const { latitude, longitude } = position.coords;
            const result = await updateUserLocation(userId, latitude, longitude);
            if (result.error) {
                toast({ variant: 'destructive', title: "Location Error", description: "Could not save your location. You can set it manually in your profile." });
            }
            handleLocationComplete();
            resolve();
        },
        () => {
            handleLocationComplete();
            resolve();
        },
        { timeout: 5000 } 
      );
    });
  }, [toast, handleLocationComplete]);
  
  const handleLocationLogic = React.useCallback(async (userId: string) => {
      if (navigator.permissions) {
        const permission = await navigator.permissions.query({ name: 'geolocation' });
        if (permission.state === 'granted') {
            await attemptToGetLocation(userId);
        } else {
            setView('location');
        }
      } else {
          setView('location');
      }
  }, [attemptToGetLocation]);
  
  const handleAllowLocationFromPrompt = React.useCallback(async () => {
    const currentUserId = localStorage.getItem('currentUserId');
    if (!currentUserId) {
        toast({ variant: 'destructive', title: "User Not Found", description: "Could not find user to update location. Please log in again." });
        handleLocationComplete();
        return;
    }

    await new Promise<void>((resolve) => {
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                const result = await updateUserLocation(currentUserId, latitude, longitude);
                if (result.error) {
                    toast({ variant: 'destructive', title: "Location Error", description: result.error });
                } else {
                    toast({ title: "Location Saved!", description: "We've updated your location." });
                }
                handleLocationComplete();
                resolve();
            },
            (error) => {
                toast({
                    variant: 'destructive',
                    title: "Location Access Denied",
                    description: "You can enable location services in your browser settings to find matches nearby.",
                });
                handleLocationComplete();
                resolve();
            }
        );
    });
  }, [toast, handleLocationComplete]);


  const handleBackdropClick = () => {
    if (view !== 'start' && view !== 'location') {
      setView('start');
    }
  };

  const handleLoginSuccess = async (userId: string) => {
      localStorage.setItem('currentUserId', userId);
      setIsLoginOpen(false);
      setPostLogin(true); 
      await handleLocationLogic(userId);
  };

  const handleSignupSuccess = async (userId: string) => {
      localStorage.setItem('currentUserId', userId);
      setPostLogin(true);
      setView('location');
  };

  const cardVariants = {
    initial: { y: '100vh', opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: '100vh', opacity: 0 },
    transition: { type: 'spring', stiffness: 400, damping: 30 }
  };

  if (checkingAuth || postLogin) {
    return (
      <div className="min-h-screen w-full bg-black">
        <PageLoader />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen w-full bg-black overflow-x-hidden"
      onClick={handleBackdropClick}
    >
      
      <header className="fixed top-0 left-0 right-0 z-20">
        <div className="container mx-auto flex h-20 items-center justify-between px-4">
          <div className="flex items-center gap-2 font-bold text-lg">
            <Heart className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-neutral-50 to-neutral-400">
              RevaDates
            </span>
          </div>
        </div>
      </header>

      
      <div className="absolute inset-0 -z-10 h-full w-full bg-background bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]">
        <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-primary/5 blur-[100px]" />
      </div>
      
      <LoginOptions isOpen={isLoginOpen} onOpenChange={setIsLoginOpen} onLoginSuccess={handleLoginSuccess} />

      
      <div className="flex min-h-screen flex-col items-center justify-center text-center px-4">
        <AnimatePresence mode="wait">
          {view === 'start' && (
            <motion.div
              key="start"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col items-center"
            >
              <h2 className="text-4xl font-bold tracking-tight text-neutral-200 mb-4">
                Get started
              </h2>
              <div className="mb-8 max-w-2xl h-8 flex items-center justify-center mt-2">
                <p className="text-lg text-neutral-300">
                  {typedPhrase}
                  <span className="animate-pulse">|</span>
                </p>
              </div>
              <div className="flex flex-col items-center gap-4 mt-4">
                <div className="flex flex-row gap-4">
                  <Button
                    size="lg"
                    className="font-semibold rounded-full text-white bg-white/10 backdrop-blur-md hover:bg-white/20"
                    onClick={() => setView('signup')}
                  >
                    Sign up
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="font-semibold rounded-full bg-white/10 backdrop-blur-md hover:bg-white/20"
                    onClick={() => setIsLoginOpen(true)}
                  >
                    Login
                  </Button>
                </div>

                <button
                  onClick={scrollToAbout}
                  className="text-sm text-neutral-400 hover:text-white transition-colors mt-3 underline"
                >
                  Learn more about RevaDates
                </button>
              </div>
            </motion.div>
          )}
           
          {view === 'forgot-password' && (
            <motion.div key="forgot-password" {...cardVariants} onClick={(e) => e.stopPropagation()}>
              <ForgotPasswordForm onSwitchToLogin={() => {
                setView('start');
                setIsLoginOpen(true);
              }} />
            </motion.div>
          )}

          {view === 'signup' && (
            <motion.div key="signup" {...cardVariants} onClick={(e) => e.stopPropagation()}>
              <SignupForm onSwitchToLogin={() => {
                  setView('start');
                  setIsLoginOpen(true);
              }} onSignupSuccess={handleSignupSuccess} />
            </motion.div>
          )}

          {view === 'location' && (
             <motion.div key="location" {...cardVariants} onClick={(e) => e.stopPropagation()}>
                <LocationPermissionPrompt onComplete={handleLocationComplete} onAllow={handleAllowLocationFromPrompt} />
             </motion.div>
          )}

        </AnimatePresence>
      </div>

      
      <div
        ref={aboutRef}
        className="w-full bg-black text-white py-20 px-6 border-t border-white/10"
      >
        <div className="max-w-3xl mx-auto text-center">
            <ScrollReveal
                textClassName="text-3xl md:text-4xl font-bold mb-4"
                baseRotation={-5}
                baseOpacity={0.2}
            >
                About RevaDates
            </ScrollReveal>
             <ScrollReveal
                textClassName="text-zinc-400 text-base md:text-lg leading-relaxed"
                baseRotation={2}
                baseOpacity={0.1}
            >
                {`RevaDates is your safe space to connect authentically. Whether you're here for sparks, deep conversations, or just fun vibes — you're free to express yourself without judgment.

We focus on raw, real connections powered by intuitive design and a privacy-first approach. Join a community that's not afraid to be fully themselves.`}
            </ScrollReveal>
        </div>
      </div>
    </div>
  );
}
