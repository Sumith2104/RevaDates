
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
  const [locationError, setLocationError] = React.useState(false);

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

      // First, get the current user's profile to check for location
      const { data: currentUserProfile, error: currentUserError } = await supabase
        .from('profiles')
        .select('location')
        .eq('id', currentUserId)
        .single();
      
      if (currentUserError) {
          console.error("Error fetching current user:", currentUserError);
          setUsers([]);
          setLoading(false);
          return;
      }
      
      const hasLocation = currentUserProfile && currentUserProfile.location;
      if (!hasLocation) {
        setLocationError(true); // Keep the flag to show a dismissible notice later
      }

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
      
      let profiles: any[] = [];
      let rpcError = null;

      if (hasLocation) {
        // Use the RPC function to get nearby profiles
        const { data: nearbyProfiles, error } = await supabase.rpc(
          'find_nearby_profiles',
          {
            current_user_id: currentUserId,
            radius_meters: 50000, // 50km radius
          }
        );
        profiles = nearbyProfiles;
        rpcError = error;
      } else {
        // Fallback: get all other profiles if location is not available
        const { data: allProfiles, error } = await supabase
          .from('profiles')
          .select('*')
          .not('id', 'eq', currentUserId);
        profiles = allProfiles;
        rpcError = error;
      }


      if (rpcError) {
        console.error('Error fetching profiles:', rpcError);
        setUsers([]);
        setLoading(false);
        return;
      }

      // Filter out users that have been swiped on
      const filteredProfiles = profiles.filter(p => !swipedUserIds.includes(p.id));

      if (filteredProfiles) {
        const mappedUsers: UserProfile[] = filteredProfiles.map(profile => ({
          ...profile,
          age: differenceInYears(new Date(), new Date(profile.dob)),
          distance: profile.distance_meters ? Math.round(profile.distance_meters / 1000) : null,
        }));
        setUsers(mappedUsers);
      }
       setLoading(false);
    }

    if (currentUserId) {
        fetchProfiles();
    }
  }, [currentUserId]);


  if (loading) {
      return (
          <AppShell>
              <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                  <p className="text-xl font-medium">Finding profiles for you...</p>
              </div>
          </AppShell>
      )
  }

  if (locationError) {
    return (
        <AppShell>
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-8">
                <p className="text-xl font-medium">Please Enable Location</p>
                <p className="mt-2">We need your location to find people nearby. Please enable location services in your browser or device settings and log in again.</p>
            </div>
        </AppShell>
    )
  }

  if (!users || users.length === 0) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-8">
          <p className="text-xl font-medium">No new profiles found nearby.</p>
          <p className="mt-2">Try increasing your distance range in Settings, or check back later!</p>
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
