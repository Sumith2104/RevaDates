
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
                                            Continue with Email & Password
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
                                         <Button onClick={handleOtpLogin} variant="outline" className="w-full rounded-full" disabled={isLoading || !email}>
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
