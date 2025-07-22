
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
import { sendOtpEmail, createUser } from '@/lib/actions';
import { createClient } from '@/lib/supabase/client';
import { motion } from 'framer-motion';

interface SignupFormProps {
    onSwitchToLogin: () => void;
    onSignupSuccess: (userId: string) => void;
}

export const SignupForm = React.forwardRef<HTMLDivElement, SignupFormProps>(({ onSwitchToLogin, onSignupSuccess }, ref) => {
  const [step, setStep] = React.useState<'details' | 'otp' | 'onboarding'>('details');
  const [generatedOtp, setGeneratedOtp] = React.useState('');
  const [enteredOtp, setEnteredOtp] = React.useState(new Array(4).fill(""));
  const [formData, setFormData] = React.useState<any>(null); // Changed to any to be more flexible
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
    
    // Store form data as a plain object
    const details: {[key: string]: any} = {};
    currentFormData.forEach((value, key) => {
        details[key] = value;
    });
    setFormData(details);
    
    const result = await sendOtpEmail(email);

    setIsLoading(false);

    if (result.error || !result.otp) {
      toast({
        variant: 'destructive',
        title: 'Could Not Send Code',
        description: result.error || 'An unknown error occurred while sending the verification code.',
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
  
  const handleOtpSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    if (enteredOtp.join("") !== generatedOtp) {
        toast({
          variant: 'destructive',
          title: 'Invalid Code',
          description: 'The verification code you entered is incorrect. Please try again.',
        });
        setIsLoading(false);
        return;
    }
    
    if (!formData) {
        toast({
          variant: 'destructive',
          title: 'Signup Error',
          description: 'An unexpected error occurred. Please go back and try again.',
        });
        setIsLoading(false);
        return;
    }

    setIsLoading(false);
    setStep('onboarding');
  };
  
  const handleOnboardingSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const onboardingData = new FormData(e.currentTarget);
    const fullUserData = {
        ...formData,
        gender: onboardingData.get('gender') as string,
        genderPreference: onboardingData.get('genderPreference') as string,
    };
    
    const result = await createUser(fullUserData);

    if (result.error || !result.data) {
        setIsLoading(false);
        toast({
          variant: 'destructive',
          title: 'Signup Failed',
          description: result.error || "We couldn't create your account. Please try again.",
        });
    } else {
        localStorage.setItem('currentUserId', result.data.id);
        
        setIsLoading(false);
        toast({
          title: 'Account Created!',
          description: 'Welcome to RevaDates!',
        });
        
        onSignupSuccess(result.data.id);
    }
  }


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
    { value: '05', label: 'May' }, { value: '06', 'label': 'June' },
    { value: '07', label: 'July' }, { value: '08', 'label': 'August' },
    { value: '09', label: 'September' }, { value: '10', 'label': 'October' },
    { value: '11', label: 'November' }, { value: '12', 'label': 'December' },
  ];
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  
  if (step === 'onboarding') {
    return (
        <div ref={ref}>
            <Card className="mx-auto max-w-sm w-full shadow-2xl bg-white/10 backdrop-blur-lg rounded-lg border-0">
                <form onSubmit={handleOnboardingSubmit}>
                    <CardHeader className="text-center">
                        <CardTitle className="text-2xl">Tell us about you</CardTitle>
                        <CardDescription>This helps us find you better matches.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4">
                        <div className="grid gap-2 text-left">
                            <Label htmlFor="gender">I am a...</Label>
                            <Select name="gender" required disabled={isLoading}>
                                <SelectTrigger className="rounded-lg">
                                    <SelectValue placeholder="Select your gender" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Male">Man</SelectItem>
                                    <SelectItem value="Female">Woman</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2 text-left">
                            <Label htmlFor="genderPreference">I am interested in...</Label>
                            <Select name="genderPreference" required disabled={isLoading}>
                                <SelectTrigger className="rounded-lg">
                                    <SelectValue placeholder="Select your preference" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="men">Men</SelectItem>
                                    <SelectItem value="women">Women</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <Button type="submit" className="w-full rounded-full" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Finish Signup
                        </Button>
                    </CardContent>
                </form>
            </Card>
        </div>
    );
  }

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
                  Verify
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
                <Label htmlFor="firstName">First name</Label>
                <Input id="firstName" name="firstName" placeholder="John" required disabled={isLoading} className="rounded-lg" />
              </div>
              <div className="grid gap-2 text-left">
                <Label htmlFor="lastName">Last name</Label>
                <Input id="lastName" name="lastName" placeholder="Doe" required disabled={isLoading} className="rounded-lg" />
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
