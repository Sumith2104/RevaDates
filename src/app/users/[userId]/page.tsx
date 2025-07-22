
'use client';

import * as React from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter, useParams } from 'next/navigation';
import { PublicProfileView } from '@/components/profile/public-profile-view';
import { Lock } from 'lucide-react';
import { getIsMatch } from '@/lib/actions';
import { AppShell } from '@/components/shared/app-shell';
import { useCurrentUser } from '@/hooks/use-current-user';
import { PageLoader } from '@/components/shared/page-loader';

export default function UserProfilePage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.userId as string;

  const { user: currentUserId, loading: userLoading } = useCurrentUser();
  const [profile, setProfile] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [isViewable, setIsViewable] = React.useState(false);

  React.useEffect(() => {
    // This effect should run when userId or currentUserId changes.
    // The initial check for currentUserId is important because it might be null initially.
    if (!userId || !currentUserId) {
      if (!userLoading) {
        // If we are done loading and still don't have IDs, something is wrong,
        // but we avoid running fetch.
        setLoading(false);
      }
      return;
    }

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
              // If private, check for a match.
              // We must re-check currentUserId here to satisfy TypeScript, as it's from an outer scope.
              if (currentUserId) {
                const matchStatus = await getIsMatch(currentUserId, userId);
                setIsViewable(matchStatus);
              } else {
                setIsViewable(false); // Can't check for a match without the current user.
              }
          }
          
          setProfile({
            ...data,
            dob: new Date(data.dob),
          });
      }
      
      setLoading(false);
    }

    fetchData();
  }, [userId, currentUserId, router, userLoading]);

  if (loading || userLoading) {
     return (
        <AppShell>
            <PageLoader />
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
