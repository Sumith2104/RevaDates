
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';

export function useCurrentUser() {
  const [user, setUser] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const router = useRouter();

  React.useEffect(() => {
    setLoading(true);
    const userId = localStorage.getItem('currentUserId');
    if (!userId) {
      router.push('/');
    } else {
      setUser(userId);
    }
    setLoading(false);
  }, [router]);

  return { user, loading };
}
