
'use client';

import * as React from 'react';
import { AppShell } from '@/components/shared/app-shell';
import { SwipeDeck } from '@/components/dashboard/swipe-deck';
import { createClient } from '@/lib/supabase/client';
import type { UserProfile } from '@/lib/types';
import { differenceInYears } from 'date-fns';
import { useRouter } from 'next/navigation';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
  const [showPhotoPrompt, setShowPhotoPrompt] = React.useState(false);

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
        .select('discovery_age_min, discovery_age_max, discovery_distance_km, location, blocked_users, photos')
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
          photos: currentUserPhotos,
      } = currentUserProfile;

      // Check if user has photos and if prompt has been dismissed this session
      const promptDismissed = sessionStorage.getItem('photoPromptDismissed');
      if (!currentUserPhotos || currentUserPhotos.length === 0 && !promptDismissed) {
          setShowPhotoPrompt(true);
      }
      
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

      // Get IDs of users the current user has already matched with
      const { data: matchedUsersData, error: matchedError } = await supabase
        .from('matches')
        .select('user1_id, user2_id')
        .or(`user1_id.eq.${currentUserId},user2_id.eq.${currentUserId}`);

      if (matchedError) {
        console.error('Error fetching matched users:', matchedError);
        // Continue without match data if there's an error
      }
      const matchedUserIds = matchedUsersData ? matchedUsersData.flatMap(match => [match.user1_id, match.user2_id]).filter(id => id !== currentUserId) : [];
      
      // Combine all users to exclude: current user, swiped users, matched users, and blocked users
      const excludedIds = new Set([
        currentUserId, 
        ...swipedUserIds,
        ...matchedUserIds, 
        ...(blockedUsers || [])
      ]);
      const allExcludedIds = Array.from(excludedIds);
      
      // Fetch all potential profiles (excluding the ones determined above), ordered by most recent
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
  }, [currentUserId, router]);


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

  const handlePromptLater = () => {
    sessionStorage.setItem('photoPromptDismissed', 'true');
    setShowPhotoPrompt(false);
  }

  return (
    <>
      <AppShell>
        <SwipeDeck users={users} currentUserId={currentUserId!} />
      </AppShell>
      <AlertDialog open={showPhotoPrompt} onOpenChange={setShowPhotoPrompt}>
          <AlertDialogContent className="w-full max-w-[330px] rounded-lg p-6 text-center shadow-2xl bg-white/10 backdrop-blur-lg">
              <AlertDialogHeader className="text-center sm:text-center">
                  <AlertDialogTitle className="text-white text-lg font-semibold">Upload a Profile Photo</AlertDialogTitle>
                  <AlertDialogDescription className="text-sm text-white/70 mt-2">
                      Profiles with photos get more matches. Add a photo to show your best self!
                  </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="mt-6 flex flex-row sm:flex-row w-full gap-2">
                  <AlertDialogAction onClick={() => router.push('/profile')} className="w-full bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded-full shadow-md">Upload Photo</AlertDialogAction>
                  <AlertDialogCancel onClick={handlePromptLater} className="w-full bg-white hover:bg-gray-100 hover:text-black text-black px-6 py-2 rounded-full shadow-md mt-0">Later</AlertDialogCancel>
              </AlertDialogFooter>
          </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
