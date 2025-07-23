
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { verifyLoginOtp } from '@/lib/actions';
import { motion } from 'framer-motion';

interface OtpLoginFormProps {
    email: string;
    onLoginSuccess: (userId: string) => void;
}

export const OtpLoginForm = React.forwardRef<HTMLDivElement, OtpLoginFormProps>(({ email, onLoginSuccess }, ref) => {
  const { toast } = useToast();
  const [otp, setOtp] = React.useState(new Array(4).fill(""));
  const [isLoading, setIsLoading] = React.useState(false);
  const inputRefs = React.useRef<(HTMLInputElement | null)[]>([]);

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const result = await verifyLoginOtp(email, otp.join(""));
    setIsLoading(false);

    if (result.error || !result.userId) {
        toast({
            variant: 'destructive',
            title: 'Login Failed',
            description: result.error,
        });
    } else {
        toast({
            title: 'Login Successful',
            description: `Welcome back!`,
        });
        onLoginSuccess(result.userId);
    }
  };

  const handleOtpChange = (element: HTMLInputElement, index: number) => {
    if (isNaN(Number(element.value))) return;

    const newOtp = [...otp];
    newOtp[index] = element.value;
    setOtp(newOtp);

    if (element.nextSibling && element.value) {
      (element.nextSibling as HTMLInputElement).focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };
  
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const paste = e.clipboardData.getData('text');
    if (paste.length === 4 && /^\d+$/.test(paste)) {
        e.preventDefault();
        const newOtp = paste.split('');
        setOtp(newOtp);
        inputRefs.current[3]?.focus();
    }
  };

  return (
    <div ref={ref}>
        <form className="grid gap-4" onSubmit={handleOtpSubmit}>
            <p className="text-sm text-muted-foreground text-left">
                A 4-digit code was sent to <span className="font-semibold text-foreground">{email}</span>.
            </p>
            <div className="grid gap-2 text-left">
                <Label htmlFor="otp">Verification Code</Label>
                <div className="flex justify-center gap-2" onPaste={handlePaste}>
                  {otp.map((data, index) => (
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
                      ref={(el) => { inputRefs.current[index] = el; }}
                      className="w-12 h-12 text-center text-lg rounded-lg"
                      disabled={isLoading}
                    />
                  ))}
                </div>
            </div>
            <Button type="submit" className="w-full rounded-full" disabled={isLoading || otp.join("").length !== 4}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Verify & Login
            </Button>
        </form>
    </div>
  );
});

OtpLoginForm.displayName = 'OtpLoginForm';
