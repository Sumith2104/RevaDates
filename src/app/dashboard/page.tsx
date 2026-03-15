
'use client';

import * as React from 'react';
import { AppShell } from '@/components/shared/app-shell';
import { SwipeDeck } from '@/components/dashboard/swipe-deck';
import type { UserProfile } from '@/lib/types';
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
import { handleUndoSwipeAction, getPotentialProfiles } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { RefreshCcw } from 'lucide-react';
import { useCurrentUser } from '@/hooks/use-current-user';
import { PageLoader } from '@/components/shared/page-loader';
import { getCurrentUserProfile } from '@/lib/actions';

const PAGE_SIZE = 50;
const PRELOAD_THRESHOLD = 10; // preload next batch when this many cards remain

function shuffle(array: any[]) {
  let currentIndex = array.length, randomIndex;
  while (currentIndex > 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
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
  const [offset, setOffset] = React.useState(0);
  const [hasMore, setHasMore] = React.useState(true);
  const [isFetchingMore, setIsFetchingMore] = React.useState(false);
  const { toast } = useToast();

  // Fetch initial or refreshed page
  const fetchProfiles = React.useCallback(async (skipCache = false) => {
    if (!currentUserId) return;
    setLoading(true);
    setOffset(0);
    setHasMore(true);

    if (!skipCache) {
      try {
        const cachedProfiles = localStorage.getItem(`cachedProfiles_${currentUserId}`);
        const cachedHistory = localStorage.getItem(`swipedHistory_${currentUserId}`);
        if (cachedProfiles) {
          const parsed: UserProfile[] = JSON.parse(cachedProfiles);
          // Deduplicate and remove self from cached data
          const seen = new Set<string>();
          const deduped = parsed.filter(u => {
            if (u.id === currentUserId || seen.has(u.id)) return false;
            seen.add(u.id);
            return true;
          });
          setAllUsers(deduped);
          if (cachedHistory) setSwipedHistory(JSON.parse(cachedHistory));
          setLoading(false);
          return;
        }
      } catch (error) {
        console.warn("Could not read cached profiles", error);
      }
    }

    const resultProfile = await getCurrentUserProfile(currentUserId);
    if (resultProfile.error || !resultProfile.data) {
      toast({ variant: 'destructive', title: "Could not load your profile", description: "Please try logging in again." });
      setLoading(false);
      return;
    }
    const currentUserProfile = resultProfile.data;
    if (!currentUserProfile.photos || currentUserProfile.photos.length === 0) {
      setShowPhotoPrompt(true);
    }

    const result = await getPotentialProfiles(currentUserId, 0, PAGE_SIZE);
    if (result.error) {
      toast({ variant: 'destructive', title: "Database Error", description: result.error });
      setAllUsers([]);
    } else {
      // Filter out the current user (safety net on top of DB exclusion)
      const filtered = (result.data as UserProfile[]).filter(u => u.id !== currentUserId);
      const freshUsers = shuffle(filtered);
      setAllUsers(freshUsers);
      setHasMore(result.hasMore ?? false);
      setOffset(PAGE_SIZE);
      try {
        localStorage.setItem(`cachedProfiles_${currentUserId}`, JSON.stringify(freshUsers));
        localStorage.setItem(`swipedHistory_${currentUserId}`, JSON.stringify([]));
        setSwipedHistory([]);
      } catch (error) {
        console.warn("Could not save profiles to cache", error);
      }
    }
    setLoading(false);
  }, [currentUserId, toast]);

  // Background preload of the next page
  const fetchMoreProfiles = React.useCallback(async () => {
    if (!currentUserId || isFetchingMore || !hasMore) return;
    setIsFetchingMore(true);
    const result = await getPotentialProfiles(currentUserId, offset, PAGE_SIZE);
    if (!result.error && result.data && result.data.length > 0) {
      const moreUsers = shuffle(
        (result.data as UserProfile[]).filter(u => u.id !== currentUserId)
      );
      setAllUsers(prev => {
        // Deduplicate by id to prevent same profile appearing twice across pages
        const existingIds = new Set(prev.map(u => u.id));
        const newUnique = moreUsers.filter(u => !existingIds.has(u.id));
        const merged = [...prev, ...newUnique];
        try {
          if (currentUserId) localStorage.setItem(`cachedProfiles_${currentUserId}`, JSON.stringify(merged));
        } catch { }
        return merged;
      });
      setHasMore(result.hasMore ?? false);
      setOffset(prev => prev + PAGE_SIZE);
    } else {
      setHasMore(false);
    }
    setIsFetchingMore(false);
  }, [currentUserId, isFetchingMore, hasMore, offset]);

  React.useEffect(() => {
    if (currentUserId) {
      const settingsChanged = localStorage.getItem('profileSettingsChanged');
      if (settingsChanged === 'true') {
        localStorage.removeItem('profileSettingsChanged');
        fetchProfiles(true);
      } else {
        fetchProfiles(false);
      }
    }
  }, [currentUserId, fetchProfiles]);

  // Trigger preload when user reaches card 40 (10 cards remaining)
  React.useEffect(() => {
    if (allUsers.length <= PRELOAD_THRESHOLD && hasMore && !isFetchingMore && !loading) {
      fetchMoreProfiles();
    }
  }, [allUsers.length, hasMore, isFetchingMore, loading, fetchMoreProfiles]);

  const handleSwipeActionWrapper = (swipedUser: UserProfile) => {
    const newUsers = allUsers.filter(u => u.id !== swipedUser.id);
    const newHistory = [swipedUser, ...swipedHistory];
    setAllUsers(newUsers);
    setSwipedHistory(newHistory);
    try {
      if (currentUserId) {
        localStorage.setItem(`cachedProfiles_${currentUserId}`, JSON.stringify(newUsers));
        localStorage.setItem(`swipedHistory_${currentUserId}`, JSON.stringify(newHistory));
      }
    } catch (error) {
      console.warn("Could not update cached profiles after swipe", error);
    }
  };

  const handleUndo = async () => {
    if (swipedHistory.length === 0 || !currentUserId) return;
    const lastSwipedUser = swipedHistory[0];
    const result = await handleUndoSwipeAction(currentUserId, lastSwipedUser.id);
    if (result.error) {
      toast({ variant: "destructive", title: "Undo Failed", description: result.error });
    } else {
      const newHistory = swipedHistory.slice(1);
      const newUsers = [lastSwipedUser, ...allUsers];
      setAllUsers(newUsers);
      setSwipedHistory(newHistory);
      try {
        localStorage.setItem(`cachedProfiles_${currentUserId}`, JSON.stringify(newUsers));
        localStorage.setItem(`swipedHistory_${currentUserId}`, JSON.stringify(newHistory));
      } catch (error) {
        console.warn("Could not update cached profiles after undo", error);
      }
    }
  };

  if ((loading && allUsers.length === 0) || userLoading) return <PageLoader />;

  const handlePromptLater = () => setShowPhotoPrompt(false);
  const noMoreProfiles = !allUsers || allUsers.length === 0;

  return (
    <>
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
        <div className="flex-1 flex flex-col pt-16">
          {noMoreProfiles && !loading ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-8">
              <p className="text-xl font-medium">No new profiles found.</p>
              <p className="mt-2">Try increasing your age range in Settings, or check back later!</p>
              <Button onClick={() => fetchProfiles(true)} variant="outline" className="mt-4">
                <RefreshCcw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
            </div>
          ) : (
            <SwipeDeck
              users={allUsers}
              currentUserId={currentUserId!}
              onSwipe={handleSwipeActionWrapper}
              onRefresh={() => fetchProfiles(true)}
              onUndo={handleUndo}
              canUndo={swipedHistory.length > 0}
            />
          )}
        </div>
      </AppShell>
    </>
  );
}
