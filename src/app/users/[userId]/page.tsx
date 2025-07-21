
'use client';

import * as React from 'react';
import { AppShell } from '@/components/shared/app-shell';
import { createClient } from '@/lib/supabase/client';
import { useRouter, useParams } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { ProfileView } from '@/components/profile/profile-view';
import { Lock } from 'lucide-react';
import { getIsMatch } from '@/lib/actions';

export default function UserProfilePage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.userId as string;

  const [profile, setProfile] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [isMatched, setIsMatched] = React.useState(false);
  const [currentUserId, setCurrentUserId] = React.useState<string | null>(null);

  React.useEffect(() => {
    const storedUserId = localStorage.getItem('currentUserId');
    if (!storedUserId) {
      router.push('/login');
    } else {
      setCurrentUserId(storedUserId);
    }
  }, [router]);

  React.useEffect(() => {
    if (!userId || !currentUserId) return;

    async function fetchData() {
      setLoading(true);

      const matchStatus = await getIsMatch(currentUserId, userId);
      setIsMatched(matchStatus);

      if (matchStatus) {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();
        
        if (error || !data) {
          // Handle profile not found
        } else {
          setProfile({
            ...data,
            dob: new Date(data.dob),
          });
        }
      }
      
      setLoading(false);
    }

    fetchData();
  }, [userId, currentUserId]);

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

  if (!isMatched) {
    return (
        <AppShell>
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-8">
                <Lock className="h-16 w-16 mb-4" />
                <p className="text-xl font-medium">This profile is private.</p>
                <p className="mt-2">You must match with this user to view their full profile.</p>
            </div>
        </AppShell>
    );
  }

  if (!profile) {
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
      <ProfileView user={profile} />
    </AppShell>
  );
}
