
'use client';
import Link from 'next/link';
import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';

interface LoginFormProps {
    onSwitchToSignup: () => void;
    onSwitchToForgotPassword: () => void;
}

export const LoginForm = React.forwardRef<HTMLDivElement, LoginFormProps>(({ onSwitchToSignup, onSwitchToForgotPassword }, ref) => {
  const router = useRouter();
  const supabase = createClient();
  const { toast } = useToast();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);

  const updateUserLocation = (userId: string): Promise<void> => {
    return new Promise((resolve) => {
        if (!navigator.geolocation) {
            resolve(); // Resolve promise even if geolocation is not supported
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                const locationString = `POINT(${longitude} ${latitude})`;
                
                await supabase
                    .from('profiles')
                    .update({ location: locationString })
                    .eq('id', userId);

                resolve();
            },
            (error) => {
                toast({
                    variant: 'default',
                    title: 'Location Skipped',
                    description: "Could not access your location. You can enable it in settings for better matches.",
                });
                resolve(); // Resolve promise even on error
            }
        );
    });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const { data, error: queryError } = await supabase
      .from('profiles')
      .select('id, name')
      .eq('email', email)
      .eq('password', password) // In a real app, passwords should be hashed!
      .single();

    if (queryError || !data) {
      setIsLoading(false);
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: 'Invalid email or password. Please try again.',
      });
    } else {
      localStorage.setItem('currentUserId', data.id);
      
      // Wait for location update to complete before moving on
      await updateUserLocation(data.id);
      
      setIsLoading(false);
      toast({
        title: 'Login Successful',
        description: `Welcome back, ${data.name.split(' ')[0]}!`,
      });
      router.push('/dashboard');
    }
  };

  return (
    <div ref={ref}>
        <Card className="mx-auto max-w-sm w-full shadow-2xl bg-white/10 backdrop-blur-lg rounded-lg border-0">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Login</CardTitle>
            <CardDescription>Enter your email below to login to your account</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4" onSubmit={handleLogin}>
              <div className="grid gap-2 text-left">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="Your Email" 
                  required 
                  className="rounded-lg"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <div className="grid gap-2 text-left">
                <div className="flex items-center">
                  <Label htmlFor="password">Password</Label>
                   <Button variant="link" className="ml-auto inline-block text-sm underline p-0 h-auto" onClick={onSwitchToForgotPassword}>
                        Forgot your password?
                   </Button>
                </div>
                <Input 
                  id="password" 
                  type="password" 
                  placeholder="Your Password" 
                  required 
                  className="rounded-lg"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <Button type="submit" className="w-full rounded-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Login
              </Button>
            </form>
            <div className="mt-4 text-center text-sm">
              Don&apos;t have an account?{' '}
              <Button variant="link" className="underline p-0 h-auto" onClick={onSwitchToSignup}>
                  Sign up
              </Button>
            </div>
          </CardContent>
        </Card>
    </div>
  );
});
LoginForm.displayName = 'LoginForm';
