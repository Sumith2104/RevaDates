
'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { LoginForm } from './login-form';
import { SignupForm } from './signup-form';
import { Heart, MapPin, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
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

const TYPING_SPEED = 100;
const phrases = [
  "Find your perfect match.",
  "Connect with real people.",
  "Discover meaningful relationships.",
  "Your next great date is a swipe away."
];

function LocationPermissionPrompt({ onComplete }: { onComplete: () => void }) {
    const [status, setStatus] = React.useState<'idle' | 'loading' | 'error'>('idle');
    const { toast } = useToast();

    const handleAllowLocation = async () => {
        const currentUserId = localStorage.getItem('currentUserId');
        if (!currentUserId) {
            toast({ variant: 'destructive', title: "Error", description: "Could not find user to update." });
            onComplete();
            return;
        }

        setStatus('loading');
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                const result = await updateUserLocation(currentUserId, latitude, longitude);
                if (result.error) {
                    toast({ variant: 'destructive', title: "Error", description: result.error });
                } else {
                    toast({ title: "Location Saved!", description: "We've updated your location." });
                }
                onComplete();
            },
            (error) => {
                setStatus('error');
                toast({
                    variant: 'destructive',
                    title: "Location Denied",
                    description: "You can enable location services in your browser settings later.",
                });
                onComplete();
            }
        );
    };

    const handleSkip = () => {
        onComplete();
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
                        onClick={handleAllowLocation}
                        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2 rounded-full shadow-md"
                        disabled={status === 'loading'}
                    >
                         {status === 'loading' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Allow Location
                    </AlertDialogAction>
                    <AlertDialogCancel
                        onClick={handleSkip}
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
  const [view, setView] = React.useState<'start' | 'login' | 'signup' | 'location'>('start');
  const [typedPhrase, setTypedPhrase] = React.useState('');
  const [phraseIndex, setPhraseIndex] = React.useState(0);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const activePhrase = phrases[phraseIndex];

  const router = useRouter();
  const { toast } = useToast();
  const aboutRef = React.useRef<HTMLDivElement | null>(null);
  const scrollToAbout = () => {
    aboutRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

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
  }, [typedPhrase, activePhrase, isDeleting]);

  const handleBackdropClick = () => {
    if (view !== 'start' && view !== 'location') {
      setView('start');
    }
  };

  const handleLoginSuccess = (userId: string) => {
      localStorage.setItem('currentUserId', userId);
      setView('location');
  };

  const handleSignupSuccess = () => {
      setView('location');
  };
  
  const handleLocationComplete = () => {
      router.push('/dashboard');
  }

  const cardVariants = {
    initial: { y: '100vh', opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: '100vh', opacity: 0 },
    transition: { type: 'spring', stiffness: 400, damping: 30 }
  };

  return (
    <div
      className="min-h-screen w-full bg-black overflow-x-hidden"
      onClick={handleBackdropClick}
    >
      {/* Header */}
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

      {/* Background Grid & Glow */}
      <div className="absolute inset-0 -z-10 h-full w-full bg-background bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]">
        <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-primary/5 blur-[100px]" />
      </div>

      {/* Auth Content */}
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
                    onClick={() => setView('login')}
                  >
                    Login
                  </Button>
                </div>

                {/* ✅ About link below the buttons */}
                <button
                  onClick={scrollToAbout}
                  className="text-sm text-neutral-400 hover:text-white transition-colors mt-3 underline"
                >
                  Learn more about RevaDates
                </button>
              </div>
            </motion.div>
          )}

          {view === 'login' && (
            <motion.div key="login" {...cardVariants} onClick={(e) => e.stopPropagation()}>
              <LoginForm
                onSwitchToSignup={() => setView('signup')}
                onSwitchToForgotPassword={() => {}}
                onLoginSuccess={handleLoginSuccess}
              />
            </motion.div>
          )}

          {view === 'signup' && (
            <motion.div key="signup" {...cardVariants} onClick={(e) => e.stopPropagation()}>
              <SignupForm onSwitchToLogin={() => setView('login')} onSignupSuccess={handleSignupSuccess} />
            </motion.div>
          )}

          {view === 'location' && (
             <motion.div key="location" {...cardVariants} onClick={(e) => e.stopPropagation()}>
                <LocationPermissionPrompt onComplete={handleLocationComplete} />
             </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* Static About Section */}
      <div
        ref={aboutRef}
        className="w-full bg-black text-white py-20 px-6 border-t border-white/10"
      >
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">About RevaDates</h2>
          <p className="text-zinc-400 text-base md:text-lg leading-relaxed">
            RevaDates is your safe space to connect authentically. Whether you're here for
            sparks, deep conversations, or just fun vibes — you're free to express yourself
            without judgment.
            <br /><br />
            We focus on raw, real connections powered by intuitive design and a privacy-first
            approach. Join a community that's not afraid to be fully themselves.
          </p>
        </div>
      </div>
    </div>
  );
}
