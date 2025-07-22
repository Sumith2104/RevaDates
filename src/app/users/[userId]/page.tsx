
'use client';

import * as React from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter, useParams } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { PublicProfileView } from '@/components/profile/public-profile-view';
import { Lock } from 'lucide-react';
import { getIsMatch } from '@/lib/actions';
import { AppShell } from '@/components/shared/app-shell';
import { useCurrentUser } from '@/hooks/use-current-user';

export default function UserProfilePage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.userId as string;

  const { user: currentUserId, loading: userLoading } = useCurrentUser();
  const [profile, setProfile] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [isViewable, setIsViewable] = React.useState(false);

  React.useEffect(() => {
    if (!userId || !currentUserId) return;

    // Don't load profile if viewing your own, redirect to /profile
    if (userId === currentUserId) {
      router.push('/profile');
      return;
    }

    async function fetchData() {
      setLoading(true);

      const supabase = createClient();
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error || !data) {
        setProfile(null);
        setIsViewable(false);
      } else {
          // Check if profile is public
          if (data.is_public) {
              setIsViewable(true);
          } else {
              // If private, check for a match
              const matchStatus = await getIsMatch(currentUserId, userId);
              setIsViewable(matchStatus);
          }
          
          setProfile({
            ...data,
            dob: new Date(data.dob),
          });
      }
      
      setLoading(false);
    }

    fetchData();
  }, [userId, currentUserId, router]);

  if (loading || userLoading) {
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

  if (!isViewable) {
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

  if (!profile || !currentUserId) {
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
      <PublicProfileView user={profile} currentUserId={currentUserId} />
    </AppShell>
  );
}

    