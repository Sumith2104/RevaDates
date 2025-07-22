
'use client';

import * as React from 'react';
import { AppShell } from '@/components/shared/app-shell';
import { ProfileView } from '@/components/profile/profile-view';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useCurrentUser } from '@/hooks/use-current-user';
import { PageLoader } from '@/components/shared/page-loader';

export default function ProfilePage() {
  const router = useRouter();
  const { user: currentUserId, loading: userLoading } = useCurrentUser();
  const [user, setUser] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  
  React.useEffect(() => {
    if (!currentUserId) {
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
  }, [currentUserId]);
  
  if (loading || userLoading) {
     return (
        <AppShell>
            <PageLoader />
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

    
