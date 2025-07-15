
'use client';
import Link from 'next/link';
import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Heart, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { sendPasswordResetOtp, resetPasswordWithOtp } from '@/lib/actions';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

export const ForgotPasswordForm = React.forwardRef<HTMLDivElement, {}>((props, ref) => {
  const { toast } = useToast();
  const router = useRouter();

  const [step, setStep] = React.useState<'enter-email' | 'enter-otp'>('enter-email');
  const [email, setEmail] = React.useState('');
  const [otp, setOtp] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');

  const [isLoading, setIsLoading] = React.useState(false);
  const [isSuccess, setIsSuccess] = React.useState(false);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const result = await sendPasswordResetOtp(email);

    setIsLoading(false);

    if (result.error) {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: result.error,
        });
    } else {
        setStep('enter-otp');
        toast({
            title: 'Verification Code Sent',
            description: 'A code has been sent to your email.',
        });
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
        toast({ variant: 'destructive', title: "Passwords don't match" });
        return;
    }
    
    setIsLoading(true);
    const result = await resetPasswordWithOtp(email, otp, password);
    setIsLoading(false);

    if (result.error) {
        toast({ variant: 'destructive', title: 'Error', description: result.error });
    } else {
        toast({ title: 'Success', description: 'Your password has been reset.' });
        setIsSuccess(true);
    }
  }
  
  const cardVariants = {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: 'easeInOut' } },
  };

  if (isSuccess) {
    return (
      <motion.div initial="initial" animate="animate" variants={cardVariants} ref={ref}>
        <Card className="mx-auto max-w-sm w-full border-0 shadow-2xl" {...props}>
          <CardHeader className="text-center">
            <Heart className="mx-auto h-12 w-12 text-primary mb-4" />
            <CardTitle className="text-2xl">Password Reset</CardTitle>
            <CardDescription>Your password has been changed successfully.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={() => router.push('/login')}>
              Login
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  if (step === 'enter-otp') {
    return (
      <motion.div initial="initial" animate="animate" variants={cardVariants} ref={ref}>
        <Card className="mx-auto max-w-sm w-full border-0 shadow-2xl" {...props}>
            <CardHeader className="text-center">
                <Heart className="mx-auto h-12 w-12 text-primary mb-4" />
                <CardTitle className="text-2xl">Reset Password</CardTitle>
                <CardDescription>Enter the code sent to your email and your new password.</CardDescription>
            </CardHeader>
            <CardContent>
                <form className="grid gap-4" onSubmit={handleOtpSubmit}>
                    <div className="grid gap-2">
                        <Label htmlFor="otp">Verification Code</Label>
                        <Input
                        id="otp"
                        type="text"
                        inputMode="numeric"
                        maxLength={4}
                        placeholder="****"
                        required
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        disabled={isLoading}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="password">New Password</Label>
                        <Input
                        id="password"
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={isLoading}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="confirm-password">Confirm New Password</Label>
                        <Input
                        id="confirm-password"
                        type="password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        disabled={isLoading}
                        />
                    </div>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Reset Password
                    </Button>
                    <Button variant="link" type="button" onClick={() => setStep('enter-email')}>
                        Back
                    </Button>
                </form>
            </CardContent>
        </Card>
      </motion.div>
    )
  }

  return (
    <motion.div initial="initial" animate="animate" variants={cardVariants} ref={ref}>
      <Card className="mx-auto max-w-sm w-full border-0 shadow-2xl" {...props}>
        <CardHeader className="text-center">
          <Heart className="mx-auto h-12 w-12 text-primary mb-4" />
          <CardTitle className="text-2xl">Forgot Password</CardTitle>
          <CardDescription>Enter your email and we'll send you a code to reset your password.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4" onSubmit={handleEmailSubmit}>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Your Email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send Code
            </Button>
            <Button variant="link" asChild>
                  <Link href="/login">Back to Login</Link>
              </Button>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
});
ForgotPasswordForm.displayName = 'ForgotPasswordForm';
