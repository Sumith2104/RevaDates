
'use client';

import * as React from 'react';
import { AppShell } from '@/components/shared/app-shell';
import { SwipeDeck } from '@/components/dashboard/swipe-deck';
import { createClient } from '@/lib/supabase/client';
import type { UserProfile } from '@/lib/types';
import { differenceInYears } from 'date-fns';
import { useRouter } from 'next/navigation';

// Haversine formula to calculate distance between two lat/lon points
function getDistanceInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Function to parse POINT(lon lat) string
function parseLocation(locationString: string): { latitude: number; longitude: number } | null {
    if (!locationString) return null;
    const match = locationString.match(/POINT\(([-\d.]+) ([-\d.]+)\)/);
    if (match && match.length === 3) {
        return { longitude: parseFloat(match[1]), latitude: parseFloat(match[2]) };
    }
    return null;
}

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
      setLoading(true);

      const supabase = createClient();

      // First, get the current user's profile including settings, location, and blocked users
      const { data: currentUserProfile, error: currentUserError } = await supabase
        .from('profiles')
        .select('discovery_age_min, discovery_age_max, discovery_distance_km, location, blocked_users')
        .eq('id', currentUserId)
        .single();

      if (currentUserError) {
          console.error('Error fetching current user settings:', currentUserError);
          setLoading(false);
          return;
      }
      
      const { 
          discovery_age_min: minAge, 
          discovery_age_max: maxAge, 
          discovery_distance_km: maxDistance,
          location: currentUserLocationStr,
          blocked_users: blockedUsers,
      } = currentUserProfile;
      
      const currentUserLocation = parseLocation(currentUserLocationStr);

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
      
      // Combine all users to exclude: current user, swiped users, and blocked users
      const allExcludedIds = [currentUserId, ...swipedUserIds, ...(blockedUsers || [])];
      
      // Fetch all potential profiles (excluding the current user and already swiped/blocked ones), ordered by most recent
      let query = supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (allExcludedIds.length > 0) {
        query = query.not('id', 'in', `(${allExcludedIds.join(',')})`);
      }
      
      const { data: allProfiles, error: profilesError } = await query;

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        setUsers([]);
        setLoading(false);
        return;
      }

      // Filter profiles in the application code
      const filteredProfiles = allProfiles
        .map(profile => {
            const age = differenceInYears(new Date(), new Date(profile.dob));
            let distance = null;
            const profileLocation = parseLocation(profile.location);

            if (currentUserLocation && profileLocation) {
                distance = getDistanceInKm(
                    currentUserLocation.latitude,
                    currentUserLocation.longitude,
                    profileLocation.latitude,
                    profileLocation.longitude
                );
            }
            
            return {
                ...profile,
                age,
                distance, // distance in km
                distance_meters: distance !== null ? distance * 1000 : null,
            };
        })
        .filter(profile => {
            // Age filter
            const isAgeMatch = profile.age >= minAge && profile.age <= maxAge;
            if (!isAgeMatch) return false;

            // Distance filter
            if (currentUserLocation) { // Only filter by distance if current user has a location
                if (profile.distance === null) return false; // If we require location, exclude those without
                return profile.distance <= maxDistance;
            }
            
            return true; // If no location, don't filter by distance
        });

      if (filteredProfiles) {
        setUsers(filteredProfiles);
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

  if (!users || users.length === 0) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-8">
          <p className="text-xl font-medium">No new profiles found.</p>
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
