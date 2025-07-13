
'use client';

import * as React from 'react';
import { AppShell } from '@/components/shared/app-shell';
import { ProfileView } from '@/components/profile/profile-view';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  
  React.useEffect(() => {
    const currentUserId = localStorage.getItem('currentUserId');
    if (!currentUserId) {
      router.push('/login');
      return;
    }

    async function fetchProfile() {
      const supabase = createClient();
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUserId)
        .single();

      if (error || !profile) {
        console.error('Profile fetch error:', error);
        // Handle error, maybe redirect or show a message
        setLoading(false);
      } else {
        setUser({
            ...profile,
            dob: new Date(profile.dob), // Ensure dob is a Date object
        });
        setLoading(false);
      }
    }

    fetchProfile();
  }, [router]);
  
  if (loading) {
     return (
        <AppShell>
            <div className="container mx-auto max-w-4xl p-4">
                <Skeleton className="h-12 w-1/4 mb-4" />
                <Skeleton className="h-64 w-full" />
                <div className="space-y-4 mt-4">
                    <Skeleton className="h-8 w-1/2" />
                    <Skeleton className="h-24 w-full" />
                </div>
            </div>
        </AppShell>
     );
  }

  if (!user) {
      return (
        <AppShell>
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                <p className="text-xl font-medium">Could not load profile.</p>
            </div>
        </AppShell>
      )
  }

  return (
    <AppShell>
      <ProfileView user={user} />
    </AppShell>
  );
}
