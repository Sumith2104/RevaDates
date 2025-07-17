
'use client';

import Link from 'next/link';
import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { sendOtpEmail } from '@/lib/actions';
import { createClient } from '@/lib/supabase/client';
import { motion } from 'framer-motion';

interface SignupFormProps {
    onSwitchToLogin: () => void;
}

export const SignupForm = React.forwardRef<HTMLDivElement, SignupFormProps>(({ onSwitchToLogin }, ref) => {
  const [step, setStep] = React.useState<'details' | 'otp'>('details');
  const [generatedOtp, setGeneratedOtp] = React.useState('');
  const [enteredOtp, setEnteredOtp] = React.useState(new Array(4).fill(""));
  const [formData, setFormData] = React.useState<FormData | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();
  const inputRefs = React.useRef<(HTMLInputElement | null)[]>([]);

  const handleDetailsSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const currentFormData = new FormData(e.currentTarget);
    const email = currentFormData.get('email') as string;
    setFormData(currentFormData);
    
    const result = await sendOtpEmail(email);

    setIsLoading(false);

    if (result.error || !result.otp) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: result.error || 'An unknown error occurred.',
      });
    } else {
      setGeneratedOtp(result.otp);
      setStep('otp');
      toast({
          title: "Verification Code Sent",
          description: `A code has been sent to ${email}.`,
      });
    }
  };
  
  const saveUserLocation = (userId: string): Promise<void> => {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            console.log("Geolocation is not supported by this browser.");
            // Resolve even if location is not supported, so signup can continue
            resolve();
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
                    console.error("Error updating location:", error);
                    // Don't block signup, but log the error.
                }
                resolve();
            },
            (error) => {
                console.error("Error getting location:", error.message);
                toast({
                    variant: 'default',
                    title: 'Location Skipped',
                    description: "You can enable location later in your settings for better matches.",
                });
                // Resolve so signup can continue
                resolve();
            }
        );
    });
  };

  const handleOtpSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    if (enteredOtp.join("") !== generatedOtp) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Invalid OTP. Please try again.',
        });
        setIsLoading(false);
        return;
    }
    
    if (!formData) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'An unexpected error occurred. Please go back and try again.',
        });
        setIsLoading(false);
        return;
    }

    const firstName = formData.get('firstName') as string;
    const lastName = formData.get('lastName') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const dobYear = formData.get('dobYear') as string;
    const dobMonth = formData.get('dobMonth') as string;
    const dobDay = formData.get('dobDay') as string;
    
    const { data: newUser, error: insertError } = await supabase.from('profiles').insert({
        name: `${firstName} ${lastName}`,
        email,
        password, // Storing password directly. Should be hashed in a real app.
        dob: `${dobYear}-${dobMonth}-${dobDay}`,
        bio: "Tell us more about yourself! Share a short bio that shows your personality, interests, and what you're looking for. Add your hobbies (e.g., reading, hiking, gaming), what kind of connection you seek (friendship, serious relationship, etc.), and your current city. Upload a few photos that best represent you, and optionally verify your profile to earn a trusted badge. The more complete your profile, the better your matches!",
        photos: [],
    }).select().single();

    if (insertError) {
        setIsLoading(false);
        toast({
          variant: 'destructive',
          title: 'Signup Failed',
          description: insertError.message,
        });
    } else if (newUser) {
        localStorage.setItem('currentUserId', newUser.id);
        
        // Now attempt to get location
        await saveUserLocation(newUser.id);
        
        setIsLoading(false);
        toast({
          title: 'Account Created!',
          description: 'Welcome to RevaDates!',
        });
        router.push('/dashboard');
    } else {
        setIsLoading(false);
        toast({
          variant: 'destructive',
          title: 'Signup Failed',
          description: 'Could not create account. Please try again.',
        });
    }
  };

  const handleOtpChange = (element: HTMLInputElement, index: number) => {
    if (isNaN(Number(element.value))) return;

    const newOtp = [...enteredOtp];
    newOtp[index] = element.value;
    setEnteredOtp(newOtp);

    // Focus next input
    if (element.nextSibling && element.value) {
      (element.nextSibling as HTMLInputElement).focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace" && !enteredOtp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };
  
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const paste = e.clipboardData.getData('text');
    if (paste.length === 4 && /^\d+$/.test(paste)) {
        e.preventDefault();
        const newOtp = paste.split('');
        setEnteredOtp(newOtp);
        inputRefs.current[3]?.focus();
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
      <div ref={ref}>
        <Card className="mx-auto max-w-sm w-full shadow-2xl bg-white/10 backdrop-blur-lg rounded-lg border-0">
          <form onSubmit={handleOtpSubmit}>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Verify your email</CardTitle>
              <CardDescription>Enter the 4-digit code we sent to your email.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="otp">Verification Code</Label>
                 <div className="flex justify-center gap-2" onPaste={handlePaste}>
                    {enteredOtp.map((data, index) => {
                        return (
                            <Input
                                key={index}
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                name="otp"
                                maxLength={1}
                                value={data}
                                onChange={(e) => handleOtpChange(e.target, index)}
                                onFocus={(e) => e.target.select()}
                                onKeyDown={(e) => handleKeyDown(e, index)}
                                ref={(el) => (inputRefs.current[index] = el)}
                                className="w-12 h-12 text-center text-lg rounded-lg"
                                disabled={isLoading}
                            />
                        );
                    })}
                </div>
              </div>
              <Button type="submit" className="w-full rounded-full" disabled={isLoading || enteredOtp.join("").length !== 4}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Verify & Sign Up
              </Button>
            </CardContent>
            <CardFooter className="flex-col gap-2">
                <Button variant="link" type="button" onClick={() => { setStep('details'); }}>Go Back</Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    );
  }

  return (
    <div ref={ref}>
      <Card className="mx-auto max-w-sm w-full shadow-2xl bg-white/10 backdrop-blur-lg rounded-lg border-0">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Sign Up</CardTitle>
          <CardDescription>Create your account to find your match</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleDetailsSubmit} className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2 text-left">
                <Label htmlFor="first-name">First name</Label>
                <Input id="first-name" name="firstName" placeholder="John" required disabled={isLoading} className="rounded-lg" />
              </div>
              <div className="grid gap-2 text-left">
                <Label htmlFor="last-name">Last name</Label>
                <Input id="last-name" name="lastName" placeholder="Doe" required disabled={isLoading} className="rounded-lg" />
              </div>
            </div>
            <div className="grid gap-2 text-left">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" name="email" placeholder="m@example.com" required disabled={isLoading} className="rounded-lg" />
            </div>
            <div className="grid gap-2 text-left">
              <Label>Date of Birth</Label>
              <div className="grid grid-cols-3 gap-2">
                <Select name="dobMonth" required disabled={isLoading}>
                  <SelectTrigger className="rounded-lg">
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
                <Select name="dobDay" required disabled={isLoading}>
                  <SelectTrigger className="rounded-lg">
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
                <Select name="dobYear" required disabled={isLoading}>
                  <SelectTrigger className="rounded-lg">
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
            <div className="grid gap-2 text-left">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" name="password" required disabled={isLoading} className="rounded-lg" />
            </div>
            <Button type="submit" className="w-full rounded-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create an account
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            Already have an account?{' '}
            <Button variant="link" className="underline p-0 h-auto" onClick={onSwitchToLogin}>Login</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
});
SignupForm.displayName = 'SignupForm';
