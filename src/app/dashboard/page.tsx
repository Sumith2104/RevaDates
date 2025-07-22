
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
import { AppHeader } from '@/components/shared/app-header';
import { handleUndoSwipeAction, getDistanceBetweenUsers } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { RefreshCcw } from 'lucide-react';
import { useCurrentUser } from '@/hooks/use-current-user';
import { PageLoader } from '@/components/shared/page-loader';

// Fisher-Yates (aka Knuth) Shuffle
function shuffle(array: any[]) {
  let currentIndex = array.length,  randomIndex;

  // While there remain elements to shuffle.
  while (currentIndex > 0) {

    // Pick a remaining element.
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex], array[currentIndex]];
  }

  return array;
}

export default function DashboardPage() {
  const router = useRouter();
  const { user: currentUserId, loading: userLoading } = useCurrentUser();
  const [allUsers, setAllUsers] = React.useState<UserProfile[]>([]);
  const [swipedHistory, setSwipedHistory] = React.useState<UserProfile[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [showPhotoPrompt, setShowPhotoPrompt] = React.useState(false);
  const { toast } = useToast();
  
  const fetchProfiles = React.useCallback(async (skipPhotoCheck = false) => {
    if (!currentUserId) return;
    setLoading(true);

    const supabase = createClient();

    // First, get the current user's profile including settings, location, and blocked users
    const { data: currentUserProfile, error: currentUserError } = await supabase
      .from('profiles')
      .select('discovery_age_min, discovery_age_max, discovery_gender_preference, blocked_users, photos')
      .eq('id', currentUserId)
      .single();

    if (currentUserError) {
        toast({ variant: 'destructive', title: "Could not load your profile", description: "Please try logging in again." });
        setLoading(false);
        return;
    }
    
    // Check if user has photos BEFORE fetching anyone else, unless skipped
    if (!skipPhotoCheck && (!currentUserProfile.photos || currentUserProfile.photos.length === 0)) {
        setShowPhotoPrompt(true);
        setLoading(false); // Stop loading, show the prompt
        return; // Exit early
    }
    
    const { 
        discovery_age_min: minAge, 
        discovery_age_max: maxAge,
        discovery_gender_preference: genderPreference, 
        blocked_users: blockedUsers,
    } = currentUserProfile;

    // Get IDs of users the current user has already swiped on
    const { data: swipedUsersData, error: swipedError } = await supabase
      .from('swipes')
      .select('swiped_id')
      .eq('swiper_id', currentUserId);

    if (swipedError) {
      toast({ variant: 'destructive', title: "Database Error", description: "Could not fetch your swipe history." });
      setAllUsers([]);
      setLoading(false);
      return;
    }
    const swipedUserIds = swipedUsersData.map(item => item.swiped_id);

    // Get IDs of users the current user has already matched with
    const { data: matchedUsersData, error: matchedError } = await supabase
      .from('matches')
      .select('user1_id, user2_id')
      .or(`user1_id.eq.${currentUserId},user2_id.eq.${currentUserId}`);

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

    // Apply gender preference filter
    if (genderPreference === 'men') {
        query = query.eq('gender', 'Male');
    } else if (genderPreference === 'women') {
        query = query.eq('gender', 'Female');
    }
    
    const { data: allProfiles, error: profilesError } = await query;

    if (profilesError) {
      toast({ variant: 'destructive', title: "Database Error", description: "Could not fetch new profiles to show." });
      setAllUsers([]);
      setLoading(false);
      return;
    }

    // Filter profiles in the application code and calculate distances
    const profilesWithAge = allProfiles
      .map(profile => ({
          ...profile,
          age: differenceInYears(new Date(), new Date(profile.dob)),
      }))
      .filter(profile => {
          const isAgeMatch = profile.age >= minAge && profile.age <= maxAge;
          return isAgeMatch;
      });

    // Pre-load all distances
    const profilesWithDistance = await Promise.all(
      profilesWithAge.map(async (profile) => {
        const distance = await getDistanceBetweenUsers(currentUserId, profile.id);
        return {
          ...profile,
          distance_meters: distance !== null ? distance * 1000 : null,
        };
      })
    );

    if (profilesWithDistance) {
      setAllUsers(shuffle(profilesWithDistance));
    }
     setLoading(false);
  }, [currentUserId, toast]);

  React.useEffect(() => {
    if (currentUserId) {
        fetchProfiles(false); // Initial fetch, check for photos
    }
  }, [currentUserId, fetchProfiles]);

  const handleSwipeActionWrapper = (swipedUser: UserProfile) => {
    setAllUsers(allUsers.filter(u => u.id !== swipedUser.id));
    setSwipedHistory(prev => [swipedUser, ...prev]);
  };
  
  const handleUndo = async () => {
    if (swipedHistory.length === 0 || !currentUserId) return;

    const lastSwipedUser = swipedHistory[0];
    const result = await handleUndoSwipeAction(currentUserId, lastSwipedUser.id);
    
    if (result.error) {
      toast({
        variant: "destructive",
        title: "Undo Failed",
        description: result.error,
      });
    } else {
      setSwipedHistory(prev => prev.slice(1));
      setAllUsers(prev => [lastSwipedUser, ...prev]);
    }
  };
  
  if (loading || userLoading) {
      return (
          <AppShell>
            <AppHeader />
            <PageLoader />
          </AppShell>
      )
  }
  
  const handlePromptLater = () => {
    setShowPhotoPrompt(false);
    fetchProfiles(true); // Re-fetch profiles, but this time skip the photo check
  }
  
  if (showPhotoPrompt) {
     return (
        <AppShell>
            <AppHeader />
             <AlertDialog open={showPhotoPrompt} onOpenChange={setShowPhotoPrompt}>
                <AlertDialogContent className="w-full max-w-[330px] rounded-lg p-6 text-center shadow-2xl bg-white/10 backdrop-blur-lg">
                    <AlertDialogHeader className="text-center sm:text-center">
                        <AlertDialogTitle className="text-white text-lg font-semibold">Upload a Profile Photo</AlertDialogTitle>
                        <AlertDialogDescription className="text-sm text-white/70 mt-2">
                            Profiles with photos get more matches. Add a photo to show your best self!
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-6 flex flex-row sm:flex-row w-full gap-2">
                        <AlertDialogAction onClick={() => router.push('/profile')} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2 rounded-full shadow-md">Upload Photo</AlertDialogAction>
                        <AlertDialogCancel onClick={handlePromptLater} className="w-full bg-white hover:bg-gray-100 hover:text-black text-black px-6 py-2 rounded-full shadow-md mt-0">Later</AlertDialogCancel>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AppShell>
     )
  }
  
  const noMoreProfiles = !allUsers || allUsers.length === 0;

  return (
    <>
      <AppShell>
        <AppHeader />
        <div className="flex-1 flex flex-col pt-16">
          {noMoreProfiles ? (
              <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-8">
                  <p className="text-xl font-medium">No new profiles found.</p>
                  <p className="mt-2">Try increasing your age range in Settings, or check back later!</p>
                  <Button onClick={() => fetchProfiles(true)} variant="outline" className="mt-4">
                    <RefreshCcw className="mr-2 h-4 w-4" />
                    Refresh
                  </Button>
              </div>
          ) : (
            <SwipeDeck users={allUsers} currentUserId={currentUserId!} onSwipe={handleSwipeActionWrapper} onRefresh={() => fetchProfiles(true)} onUndo={handleUndo} canUndo={swipedHistory.length > 0} />
          )}
        </div>
      </AppShell>
    </>
  );
}

    
