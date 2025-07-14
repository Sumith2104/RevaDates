
'use client';
import Link from 'next/link';
import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Heart, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { sendPasswordResetEmail } from '@/lib/actions';

export const ForgotPasswordForm = React.forwardRef<HTMLDivElement, {}>((props, ref) => {
  const { toast } = useToast();
  const [email, setEmail] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSubmitted, setIsSubmitted] = React.useState(false);

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const result = await sendPasswordResetEmail(email);

    setIsLoading(false);

    if (result.error) {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: result.error,
        });
    } else {
        setIsSubmitted(true);
    }
  };

  if (isSubmitted) {
    return (
        <Card className="mx-auto max-w-sm w-full border-0 shadow-2xl" ref={ref} {...props}>
          <CardHeader className="text-center">
            <Heart className="mx-auto h-12 w-12 text-primary mb-4" />
            <CardTitle className="text-2xl">Check Your Email</CardTitle>
            <CardDescription>If an account with that email exists, we've sent a link to reset your password.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/login">Back to Login</Link>
            </Button>
          </CardContent>
        </Card>
    );
  }

  return (
    <Card className="mx-auto max-w-sm w-full border-0 shadow-2xl" ref={ref} {...props}>
      <CardHeader className="text-center">
        <Heart className="mx-auto h-12 w-12 text-primary mb-4" />
        <CardTitle className="text-2xl">Forgot Password</CardTitle>
        <CardDescription>Enter your email and we'll send you a link to reset your password.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4" onSubmit={handleRequest}>
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
            Send Reset Link
          </Button>
           <Button variant="link" asChild>
                <Link href="/login">Back to Login</Link>
            </Button>
        </form>
      </CardContent>
    </Card>
  );
});
ForgotPasswordForm.displayName = 'ForgotPasswordForm';
