
'use client';
import Link from 'next/link';
import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Heart, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { resetPassword } from '@/lib/actions';

export const ResetPasswordForm = React.forwardRef<HTMLDivElement, {}>((props, ref) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [isSuccess, setIsSuccess] = React.useState(false);

  const token = searchParams.get('token');

  React.useEffect(() => {
    if (!token) {
        setError("No reset token found. Please request a new password reset link.");
    }
  }, [token]);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
        toast({ variant: 'destructive', title: "Passwords don't match" });
        return;
    }
    if (!token) return;

    setIsLoading(true);
    const result = await resetPassword(token, password);
    setIsLoading(false);

    if (result.error) {
        toast({ variant: 'destructive', title: 'Error', description: result.error });
    } else {
        toast({ title: 'Success', description: 'Your password has been reset.' });
        setIsSuccess(true);
    }
  };

  if (isSuccess) {
     return (
        <Card className="mx-auto max-w-sm w-full border-0 shadow-2xl" ref={ref} {...props}>
          <CardHeader className="text-center">
            <Heart className="mx-auto h-12 w-12 text-primary mb-4" />
            <CardTitle className="text-2xl">Password Reset</CardTitle>
            <CardDescription>Your password has been changed successfully.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/login">Proceed to Login</Link>
            </Button>
          </CardContent>
        </Card>
    );
  }

  if (error) {
      return (
        <Card className="mx-auto max-w-sm w-full border-0 shadow-2xl" ref={ref} {...props}>
          <CardHeader className="text-center">
            <Heart className="mx-auto h-12 w-12 text-destructive mb-4" />
            <CardTitle className="text-2xl">Invalid Link</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/forgot-password">Request a new link</Link>
            </Button>
          </CardContent>
        </Card>
    );
  }

  return (
    <Card className="mx-auto max-w-sm w-full border-0 shadow-2xl" ref={ref} {...props}>
      <CardHeader className="text-center">
        <Heart className="mx-auto h-12 w-12 text-primary mb-4" />
        <CardTitle className="text-2xl">Reset Password</CardTitle>
        <CardDescription>Enter your new password below.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4" onSubmit={handleReset}>
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
        </form>
      </CardContent>
    </Card>
  );
});
ResetPasswordForm.displayName = 'ResetPasswordForm';
