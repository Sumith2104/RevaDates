
'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { LoginForm } from './login-form';
import { SignupForm } from './signup-form';
import { Heart } from 'lucide-react';

const phrases = [
    "Take It All Off",
    "Bare It All",
    "Show Some Skin",
    "Thirsty For Water",
    "Lose the Layers",
    "Drop Everything Now",
    "Feel The Curve",
    "Reveal Your Body",
    "Strip Without Shame",
    "Go All Natural",
    "Nothing Left On",
    "Feel Fully Free"
];

const TYPING_SPEED = 50;

export function AuthScreen() {
    const [view, setView] = React.useState<'start' | 'login' | 'signup'>('start');
    const [typedPhrase, setTypedPhrase] = React.useState('');
    const [phraseIndex, setPhraseIndex] = React.useState(0);
    const [isDeleting, setIsDeleting] = React.useState(false);
    const activePhrase = phrases[phraseIndex];

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

    const handleSetView = (newView: 'start' | 'login' | 'signup') => {
        setView(newView);
    };
    
    const handleBackdropClick = () => {
        if (view !== 'start') {
            setView('start');
        }
    };

    const cardVariants = {
        initial: { y: '100vh', opacity: 0 },
        animate: { y: 0, opacity: 1 },
        exit: { y: '100vh', opacity: 0 },
        transition: { type: 'spring', stiffness: 400, damping: 30 }
    };

    return (
        <div className="flex h-screen w-full items-center justify-center bg-black overflow-hidden" onClick={handleBackdropClick}>
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
                <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-primary/5 blur-[100px]"></div>
            </div>

            <AnimatePresence mode="wait">
                {view === 'start' && (
                    <motion.div
                        key="start"
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        transition={{ duration: 0.5 }}
                        className="container mx-auto flex flex-col items-center justify-center text-center px-4"
                    >
                        <h2 className="text-4xl font-bold tracking-tight text-neutral-200 mb-4">Get started</h2>
                        <div className="mb-8 max-w-2xl h-8 flex items-center justify-center mt-2">
                            <p className="text-lg text-neutral-300">
                                {typedPhrase}
                                <span className="animate-pulse">|</span>
                            </p>
                        </div>
                        <div className="flex flex-col items-center gap-4 mt-4">
                            <div className="flex flex-row gap-4">
                                <Button size="lg" className="font-semibold rounded-full text-white bg-white/10 backdrop-blur-md hover:bg-white/20" onClick={() => setView('signup')}>Sign up</Button>
                                <Button size="lg" variant="outline" className="font-semibold rounded-full bg-white/10 backdrop-blur-md hover:bg-white/20" onClick={() => setView('login')}>Login</Button>
                            </div>
                            <Button variant="outline" className="font-semibold rounded-lg bg-transparent border-white/20 backdrop-blur-md hover:bg-white/10">
                                About
                            </Button>
                        </div>
                    </motion.div>
                )}

                {view === 'login' && (
                    <motion.div key="login" {...cardVariants} onClick={(e) => e.stopPropagation()}>
                        <LoginForm onSwitchToSignup={() => setView('signup')} onSwitchToForgotPassword={() => {}} />
                    </motion.div>
                )}

                {view === 'signup' && (
                     <motion.div key="signup" {...cardVariants} onClick={(e) => e.stopPropagation()}>
                        <SignupForm onSwitchToLogin={() => setView('login')} />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
