'use client';

import Link from 'next/link';
import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Calendar as CalendarIcon, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

export function SignupForm() {
  const [date, setDate] = React.useState<Date>();
  const [step, setStep] = React.useState<'details' | 'otp'>('details');

  const handleDetailsSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStep('otp');
  };

  if (step === 'otp') {
    return (
      <Card className="mx-auto max-w-sm w-full">
         <form action="/dashboard" method="GET">
          <CardHeader className="text-center">
            <Heart className="mx-auto h-12 w-12 text-primary mb-4" />
            <CardTitle className="text-2xl">Verify your email</CardTitle>
            <CardDescription>Enter the 6-digit code we sent to your email address.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="otp">Verification Code</Label>
              <Input id="otp" type="text" inputMode="numeric" maxLength={6} required />
            </div>
            <Button type="submit" className="w-full">Verify & Sign Up</Button>
          </CardContent>
          <CardFooter className="flex-col gap-2">
              <Button variant="link" onClick={() => setStep('details')}>Go Back</Button>
          </CardFooter>
        </form>
      </Card>
    );
  }

  return (
    <Card className="mx-auto max-w-sm w-full">
      <CardHeader className="text-center">
        <Heart className="mx-auto h-12 w-12 text-primary mb-4" />
        <CardTitle className="text-2xl">Sign Up</CardTitle>
        <CardDescription>Create your account to find your match</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleDetailsSubmit} className="grid gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="first-name">First name</Label>
              <Input id="first-name" placeholder="Max" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="last-name">Last name</Label>
              <Input id="last-name" placeholder="Robinson" required />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="m@example.com" required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input id="phone" type="tel" placeholder="123-456-7890" required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="dob">Date of Birth</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={'outline'}
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !date && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, 'PPP') : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                  captionLayout="dropdown-buttons"
                  fromYear={1950}
                  toYear={new Date().getFullYear() - 18}
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" required />
          </div>
          <Button type="submit" className="w-full">
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
}
