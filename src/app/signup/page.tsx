'use client';

import { useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SignupForm } from '@/components/auth/signup-form';

export default function SignupPage() {
  const router = useRouter();
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as HTMLElement;
      // Prevent closing if clicking inside a Radix Popover (used by ShadCN Calendar/Select)
      if (target.closest('[data-radix-popper-content-wrapper]')) {
        return;
      }
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
      <SignupForm ref={formRef} />
    </div>
  );
}
