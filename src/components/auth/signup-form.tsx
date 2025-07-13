
'use client';

import Link from 'next/link';
import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Heart, AlertCircle, Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { sendOtpEmail } from '@/lib/actions';
import { createClient } from '@/lib/supabase/client';

export const SignupForm = React.forwardRef<HTMLDivElement, {}>((props, ref) => {
  const [step, setStep] = React.useState<'details' | 'otp'>('details');
  const [generatedOtp, setGeneratedOtp] = React.useState('');
  const [enteredOtp, setEnteredOtp] = React.useState('');
  const [formData, setFormData] = React.useState<FormData | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();

  const handleDetailsSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const currentFormData = new FormData(e.currentTarget);
    const email = currentFormData.get('email') as string;
    setFormData(currentFormData);
    
    const result = await sendOtpEmail(email);

    setIsLoading(false);

    if (result.error || !result.otp) {
      setError(result.error || "An unknown error occurred.");
    } else {
      setGeneratedOtp(result.otp);
      setStep('otp');
      toast({
          title: "Verification Code Sent",
          description: `A code has been sent to ${email}.`,
      });
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    if (enteredOtp !== generatedOtp) {
        setError("Invalid OTP. Please try again.");
        setIsLoading(false);
        return;
    }
    
    if (!formData) {
        setError("An unexpected error occurred. Please go back and try again.");
        setIsLoading(false);
        return;
    }

    const firstName = formData.get('firstName') as string;
    const lastName = formData.get('lastName') as string;
    const email = formData.get('email') as string;
    const phone = formData.get('phone') as string;
    const password = formData.get('password') as string;
    const dobYear = formData.get('dobYear') as string;
    const dobMonth = formData.get('dobMonth') as string;
    const dobDay = formData.get('dobDay') as string;
    
    // In a real app, you'd have a proper user ID from an auth system.
    // For now, we'll create a hardcoded one for demonstration.
    const id = '11111111-1111-1111-1111-111111111111';

    const { error: insertError } = await supabase.from('profiles').upsert({
        id,
        name: `${firstName} ${lastName}`,
        email,
        phone,
        password, // Storing password directly. Should be hashed in a real app.
        dob: `${dobYear}-${dobMonth}-${dobDay}`,
        bio: 'Welcome to RevaDates! Please update your bio.',
        photos: [],
    });

    setIsLoading(false);

    if (insertError) {
        setError(insertError.message);
    } else {
        router.push('/dashboard');
    }
  };

  const years = Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - 18 - i);
  const months = [
    { value: '01', label: 'January' }, { value: '02', label: 'February' },
    { value: '03', label: 'March' }, { value: '04', label: 'April' },
    { value: '05', label: 'May' }, { value: '06', label: 'June' },
    { value: '07', label: 'July' }, { value: '08', label: 'August' },
    { value: '09', label: 'September' }, { value: '10', label: 'October' },
    { value: '11', label: 'November' }, { value: '12', label: 'December' },
  ];
  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  if (step === 'otp') {
    return (
      <Card className="mx-auto max-w-sm w-full" ref={ref} {...props}>
         <form onSubmit={handleOtpSubmit}>
          <CardHeader className="text-center">
            <Heart className="mx-auto h-12 w-12 text-primary mb-4" />
            <CardTitle className="text-2xl">Verify your email</CardTitle>
            <CardDescription>Enter the 4-digit code we sent to your email.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="otp">Verification Code</Label>
              <Input 
                id="otp" 
                type="text" 
                inputMode="numeric" 
                maxLength={4} 
                placeholder="****" 
                required 
                value={enteredOtp}
                onChange={(e) => setEnteredOtp(e.target.value)}
              />
            </div>
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>
                  {error}
                </AlertDescription>
              </Alert>
            )}
            <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Verify & Sign Up
            </Button>
          </CardContent>
          <CardFooter className="flex-col gap-2">
              <Button variant="link" type="button" onClick={() => { setStep('details'); setError(null); }}>Go Back</Button>
          </CardFooter>
        </form>
      </Card>
    );
  }

  return (
    <Card className="mx-auto max-w-sm w-full" ref={ref} {...props}>
      <CardHeader className="text-center">
        <Heart className="mx-auto h-12 w-12 text-primary mb-4" />
        <CardTitle className="text-2xl">Sign Up</CardTitle>
        <CardDescription>Create your account to find your match</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleDetailsSubmit} className="grid gap-4">
          {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="first-name">First name</Label>
              <Input id="first-name" name="firstName" placeholder="John" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="last-name">Last name</Label>
              <Input id="last-name" name="lastName" placeholder="Doe" required />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" name="email" placeholder="m@example.com" required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input id="phone" type="tel" name="phone" placeholder="555-123-4567" required />
          </div>
          <div className="grid gap-2">
            <Label>Date of Birth</Label>
            <div className="grid grid-cols-3 gap-2">
              <Select name="dobMonth" required>
                <SelectTrigger>
                  <SelectValue placeholder="Month" />
                </SelectTrigger>
                <SelectContent>
                  {months.map(month => (
                    <SelectItem key={month.value} value={month.value}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select name="dobDay" required>
                <SelectTrigger>
                  <SelectValue placeholder="Day" />
                </SelectTrigger>
                <SelectContent>
                   {days.map(day => (
                    <SelectItem key={day} value={String(day)}>
                      {day}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select name="dobYear" required>
                <SelectTrigger>
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent>
                  {years.map(year => (
                    <SelectItem key={year} value={String(year)}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" name="password" required />
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create an account
          </Button>
        </form>
        <div className="mt-4 text-center text-sm">
          Already have an account?{' '}
          <Link href="/login" className="underline">
            Login
          </Link>
        </div>
      </CardContent>
    </Card>
  );
});
SignupForm.displayName = 'SignupForm';
