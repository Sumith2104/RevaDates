
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
    onSwitchToForgotPassword: () => void;
    onLoginSuccess: (userId: string) => void;
    email: string;
}

export const LoginForm = React.forwardRef<HTMLDivElement, LoginFormProps>(({ onSwitchToForgotPassword, onLoginSuccess, email }, ref) => {
  const router = useRouter();
  const supabase = createClient();
  const { toast } = useToast();
  const [password, setPassword] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);

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
        title: 'Login Unsuccessful',
        description: 'The email or password you entered is incorrect. Please try again.',
      });
    } else {
      setIsLoading(false);
      toast({
        title: 'Login Successful',
        description: `Welcome back, ${data.name.split(' ')[0]}!`,
      });
      onLoginSuccess(data.id);
    }
  };

  return (
    <div ref={ref}>
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
              disabled
            />
          </div>
          <div className="grid gap-2 text-left">
            <div className="flex items-center">
              <Label htmlFor="password">Password</Label>
               <Button variant="link" className="ml-auto inline-block text-sm underline p-0 h-auto" onClick={onSwitchToForgotPassword} type="button">
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
              autoFocus
            />
          </div>
          <Button type="submit" className="w-full rounded-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Login
          </Button>
        </form>
    </div>
  );
});
LoginForm.displayName = 'LoginForm';
