
'use client';

import { ResetPasswordForm } from '@/components/auth/reset-password-form';
import { useRouter } from 'next/navigation';
import { Suspense, useEffect, useRef } from 'react';

function ResetPasswordContent() {
  const router = useRouter();
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as HTMLElement;
      if (formRef.current && !formRef.current.contains(target)) {
        router.push('/login');
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <ResetPasswordForm ref={formRef} />
    </div>
  );
}


export default function ResetPasswordPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <ResetPasswordContent />
        </Suspense>
    )
}
