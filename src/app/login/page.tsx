'use client';

import { useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LoginForm } from '@/components/auth/login-form';

export default function LoginPage() {
  const router = useRouter();
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (formRef.current && !formRef.current.contains(event.target as Node)) {
        router.back();
      }
    }
    // Add event listener
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      // Unbind the event listener on clean up
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <LoginForm ref={formRef} />
    </div>
  );
}
