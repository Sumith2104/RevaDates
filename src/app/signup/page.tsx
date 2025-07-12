'use client';

import { useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SignupForm } from '@/components/auth/signup-form';

export default function SignupPage() {
  const router = useRouter();
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (formRef.current && !formRef.current.contains(event.target as Node)) {
        router.back();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <SignupForm ref={formRef} />
    </div>
  );
}
