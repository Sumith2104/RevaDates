
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
  const [loading, setLoading] = React.useState(true);

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
      
      // Get IDs of users the current user has already swiped on
      const { data: swipedUsersData, error: swipedError } = await supabase
        .from('swipes')
        .select('swiped_id')
        .eq('swiper_id', currentUserId);

      if (swipedError) {
        console.error('Error fetching swiped users:', swipedError);
        setUsers([]);
        setLoading(false);
        return;
      }
      const swipedUserIds = swipedUsersData.map(item => item.swiped_id);

      // Fetch profiles, excluding the current user and those already swiped on
      let query = supabase
        .from('profiles')
        .select('*')
        .neq('id', currentUserId);

      if (swipedUserIds.length > 0) {
        query = query.not('id', 'in', `(${swipedUserIds.join(',')})`);
      }
      
      const { data: profiles, error } = await query;

      if (error) {
        console.error('Error fetching profiles:', error);
        setUsers([]); // Set to empty array on error
        setLoading(false);
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
       setLoading(false);
    }

    if (currentUserId) {
        fetchProfiles();
    }
  }, [currentUserId]);


  if (loading || users === null) {
      return (
          <AppShell>
              <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                  <p className="text-xl font-medium">Finding profiles for you...</p>
              </div>
          </AppShell>
      )
  }

  if (users.length === 0) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
          <p className="text-xl font-medium">No new profiles found.</p>
          <p className="mt-2">Check back later or invite some friends!</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <SwipeDeck users={users} currentUserId={currentUserId!} />
    </AppShell>
  );
}
