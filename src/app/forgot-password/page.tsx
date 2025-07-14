
'use client';

import { ForgotPasswordForm } from '@/components/auth/forgot-password-form';
import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as HTMLElement;
      if (formRef.current && !formRef.current.contains(target)) {
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
      <ForgotPasswordForm ref={formRef} />
    </div>
  );
}
