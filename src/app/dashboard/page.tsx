
'use client';

import * as React from 'react';
import { AppShell } from '@/components/shared/app-shell';
import { SwipeDeck } from '@/components/dashboard/swipe-deck';
import { createClient } from '@/lib/supabase/client';
import type { UserProfile } from '@/lib/types';
import { differenceInYears } from 'date-fns';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const router = useRouter();
  const [users, setUsers] = React.useState<UserProfile[] | null>(null);
  const [currentUserId, setCurrentUserId] = React.useState<string | null>(null);

  React.useEffect(() => {
    const userId = localStorage.getItem('currentUserId');
    if (!userId) {
      router.push('/login');
    } else {
      setCurrentUserId(userId);
    }
  }, [router]);
  
  React.useEffect(() => {
    async function fetchProfiles() {
      if (!currentUserId) return;

      const supabase = createClient();
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .neq('id', currentUserId); // Exclude the current user

      if (error) {
        console.error('Error fetching profiles:', error);
        setUsers([]); // Set to empty array on error
        return;
      }

      if (profiles) {
        const mappedUsers: UserProfile[] = profiles.map(profile => ({
          ...profile,
          age: differenceInYears(new Date(), new Date(profile.dob)),
          distance: Math.floor(Math.random() * 15) + 1, // Random distance for now
        }));
        setUsers(mappedUsers);
      }
    }

    fetchProfiles();
  }, [currentUserId]);


  if (users === null) {
      return (
          <AppShell>
              <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                  <p className="text-xl font-medium">Loading profiles...</p>
              </div>
          </AppShell>
      )
  }

  if (users.length === 0) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
          <p className="text-xl font-medium">No other profiles found.</p>
          <p className="mt-2">Check back later or invite some friends!</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <SwipeDeck users={users} />
    </AppShell>
  );
}
