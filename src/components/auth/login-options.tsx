
'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, ArrowLeft } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { LoginForm } from './login-form';
import { OtpLoginForm } from './otp-login-form';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';
import { sendLoginOtp } from '@/lib/actions';

const GoogleIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-.97 2.48-1.94 3.21v2.75h3.54c2.08-1.92 3.28-4.74 3.28-8.01z"/>
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.54-2.75c-.98.66-2.23 1.06-3.74 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
        <path fill="#EA4335" d="M12 5.16c1.54 0 2.87.52 3.94 1.48l3.08-3.08C17.45 1.83 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        <path fill="none" d="M1 1h22v22H1z"/>
    </svg>
);


interface LoginOptionsProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    onLoginSuccess: (userId: string) => void;
}

export function LoginOptions({ isOpen, onOpenChange, onLoginSuccess }: LoginOptionsProps) {
    const [step, setStep] = React.useState<'options' | 'email-password' | 'email-otp'>('options');
    const [email, setEmail] = React.useState('');
    const [isLoading, setIsLoading] = React.useState(false);
    const { toast } = useToast();
    const supabase = createClient();

    const handleEmailContinue = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        const { data, error } = await supabase
            .from('profiles')
            .select('id')
            .eq('email', email)
            .single();

        if (error || !data) {
            toast({
                variant: 'destructive',
                title: 'No Account Found',
                description: "There's no account associated with this email. Please sign up.",
            });
        } else {
            setStep('email-password');
        }

        setIsLoading(false);
    }
    
    const handleOtpLogin = async () => {
        if (!email) {
            toast({ variant: 'destructive', title: 'Email Required', description: 'Please enter your email to receive a login code.' });
            return;
        }
        setIsLoading(true);
        const result = await sendLoginOtp(email);
        setIsLoading(false);

        if (result.error) {
            toast({
                variant: 'destructive',
                title: 'Failed to Send Code',
                description: result.error,
            });
        } else {
            setStep('email-otp');
            toast({
                title: 'Login Code Sent',
                description: 'A temporary login code has been sent to your email.',
            });
        }
    }
    
    const handleGoogleLogin = () => {
         toast({ title: 'Google Login Coming Soon!', description: 'This feature is currently under development.' });
    }

    React.useEffect(() => {
        if (isOpen) {
            setStep('options');
            setEmail('');
        }
    }, [isOpen]);

    const title = {
        'options': 'Log in or sign up',
        'email-password': 'Log in',
        'email-otp': 'Enter Your Code'
    }[step];
    
    const goBack = () => {
        if(step === 'email-password' || step === 'email-otp') {
            setStep('options');
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md w-full max-w-[330px] rounded-lg p-6 text-center shadow-2xl bg-white/10 backdrop-blur-lg border-0" onClick={(e) => e.stopPropagation()}>
                <DialogHeader className="text-center sm:text-left flex-row items-center">
                    {(step === 'email-password' || step === 'email-otp') && (
                        <Button variant="ghost" size="icon" className="absolute left-4" onClick={goBack}>
                            <ArrowLeft />
                        </Button>
                    )}
                    <DialogTitle className="text-lg font-semibold text-center flex-1">{title}</DialogTitle>
                </DialogHeader>

                <div className="mt-6">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={step}
                            initial={{ x: step === 'options' ? 0 : 300, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: -300, opacity: 0 }}
                            transition={{ type: 'tween', ease: 'easeInOut', duration: 0.3 }}
                        >
                            {step === 'options' && (
                                <div className="space-y-4">
                                     <form onSubmit={handleEmailContinue}>
                                        <div className="grid w-full items-center gap-1.5 text-left">
                                            <Label htmlFor="email" className="text-sm">Email address</Label>
                                            <Input
                                                type="email"
                                                id="email"
                                                placeholder="Enter your email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                required
                                                className="rounded-lg"
                                            />
                                        </div>
                                        <Button type="submit" className="w-full mt-4 rounded-full" disabled={isLoading || !email}>
                                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            Continue
                                        </Button>
                                    </form>

                                    <div className="relative my-4">
                                      <div className="absolute inset-0 flex items-center">
                                        <span className="w-full border-t border-white/20" />
                                      </div>
                                      <div className="relative flex justify-center text-xs uppercase">
                                        <span className="bg-card px-2 text-muted-foreground">or</span>
                                      </div>
                                    </div>
                                    
                                    <div className="space-y-3">
                                        <Button onClick={handleGoogleLogin} variant="outline" className="w-full rounded-full">
                                            <GoogleIcon /> Continue with Google
                                        </Button>
                                         <Button onClick={handleOtpLogin} variant="outline" className="w-full rounded-full" disabled={isLoading}>
                                             {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            Continue with Email & OTP
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {step === 'email-password' && (
                                <LoginForm
                                    onSwitchToForgotPassword={() => {}}
                                    onLoginSuccess={onLoginSuccess}
                                    email={email}
                                />
                            )}
                            
                            {step === 'email-otp' && (
                                <OtpLoginForm 
                                    email={email}
                                    onLoginSuccess={onLoginSuccess}
                                />
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </DialogContent>
        </Dialog>
    );
}
