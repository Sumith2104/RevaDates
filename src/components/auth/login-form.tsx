
'use client';
import Link from 'next/link';
import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Heart, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { ForgotPasswordForm } from './forgot-password-form';
import { SignupForm } from './signup-form';

export const LoginForm = React.forwardRef<HTMLDivElement, {}>((props, ref) => {
  const router = useRouter();
  const supabase = createClient();
  const { toast } = useToast();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);

  const updateUserLocation = (userId: string): Promise<void> => {
    return new Promise((resolve) => {
        if (!navigator.geolocation) {
            console.log("Geolocation is not supported by this browser.");
            resolve(); // Resolve promise even if geolocation is not supported
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                const locationString = `POINT(${longitude} ${latitude})`;
                
                const { error } = await supabase
                    .from('profiles')
                    .update({ location: locationString })
                    .eq('id', userId);

                if (error) {
                    console.error("Error updating location:", error.message);
                }
                resolve();
            },
            (error) => {
                console.error("Error getting location:", error.message);
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
      .select('id')
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
        description: 'Welcome back!',
      });
      router.push('/dashboard');
    }
  };

  const cardVariants = {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: 'easeInOut' } },
  };

  return (
    <motion.div initial="initial" animate="animate" variants={cardVariants} ref={ref}>
        <Card className="mx-auto max-w-sm w-full shadow-2xl bg-white/10 backdrop-blur-lg" {...props}>
          <CardHeader className="text-center">
            <Heart className="mx-auto h-12 w-12 text-primary mb-4" />
            <CardTitle className="text-2xl">Login</CardTitle>
            <CardDescription>Enter your email below to login to your account</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4" onSubmit={handleLogin}>
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
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">Password</Label>
                   <Dialog>
                        <DialogTrigger asChild>
                            <Button variant="link" className="ml-auto inline-block text-sm underline p-0 h-auto">Forgot your password?</Button>
                        </DialogTrigger>
                        <DialogContent className="bg-transparent border-0 p-0 max-w-sm">
                           <DialogHeader>
                              <DialogTitle className="sr-only">Forgot Password</DialogTitle>
                            </DialogHeader>
                            <ForgotPasswordForm />
                        </DialogContent>
                    </Dialog>
                </div>
                <Input 
                  id="password" 
                  type="password" 
                  placeholder="Your Password" 
                  required 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Login
              </Button>
            </form>
            <div className="mt-4 text-center text-sm">
              Don&apos;t have an account?{' '}
               <Dialog>
                  <DialogTrigger asChild>
                      <Button variant="link" className="underline p-0 h-auto">Sign up</Button>
                  </DialogTrigger>
                  <DialogContent className="bg-transparent border-0 p-0 max-w-sm">
                      <DialogHeader>
                        <DialogTitle className="sr-only">Sign Up</DialogTitle>
                      </DialogHeader>
                      <SignupForm />
                  </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>
    </motion.div>
  );
});
LoginForm.displayName = 'LoginForm';
