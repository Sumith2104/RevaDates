
'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Shield, LogOut, Loader2, Bell, XIcon, UserX } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { useDebounce } from '@/hooks/use-debounce';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { getBlockedUsers, unblockUser } from '@/lib/actions';
import type { UserProfile } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { getInitials } from '@/lib/utils';
import { ScrollArea } from '../ui/scroll-area';
import { addMinutes, formatISO } from 'date-fns';

export function BlockedUsersDialog({ userId }: { userId: string }) {
    const [blockedUsers, setBlockedUsers] = React.useState<UserProfile[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [isUnblocking, setIsUnblocking] = React.useState<string | null>(null);
    const { toast } = useToast();

    const fetchBlockedUsers = React.useCallback(async () => {
        setIsLoading(true);
        const result = await getBlockedUsers(userId);
        if (result.error) {
            toast({ variant: 'destructive', title: 'Error', description: result.error });
            setBlockedUsers([]);
        } else {
            setBlockedUsers(result.data as UserProfile[]);
        }
        setIsLoading(false);
    }, [userId, toast]);

    const handleUnblock = async (unblockedId: string) => {
        setIsUnblocking(unblockedId);
        const result = await unblockUser(userId, unblockedId);
        if (result.error) {
            toast({ variant: 'destructive', title: 'Error', description: result.error });
        } else {
            toast({ title: 'User Unblocked' });
            setBlockedUsers(prev => prev.filter(u => u.id !== unblockedId));
        }
        setIsUnblocking(null);
    }

    return (
        <Dialog onOpenChange={(open) => open && fetchBlockedUsers()}>
            <DialogTrigger asChild>
                <Button variant="outline" className="w-full justify-start gap-2">
                    <Shield className="h-4 w-4" />
                    Blocked Users
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-white/10 backdrop-blur-lg shadow-2xl rounded-lg">
                <DialogHeader>
                    <DialogTitle className="text-white">Blocked Users</DialogTitle>
                    <DialogDescription className="text-white/70">
                        Users you have blocked will appear here. You can unblock them at any time.
                    </DialogDescription>
                </DialogHeader>
                <ScrollArea className="max-h-[400px] pr-4">
                  <div className="space-y-4 py-4 text-white">
                      {isLoading && (
                          <div className="flex items-center space-x-4">
                              <Skeleton className="h-12 w-12 rounded-full bg-white/20" />
                              <div className="space-y-2">
                                  <Skeleton className="h-4 w-[150px] bg-white/20" />
                              </div>
                          </div>
                      )}
                      {!isLoading && blockedUsers.length === 0 && (
                          <div className="text-center text-white/70 py-10">
                              <UserX className="mx-auto h-12 w-12 mb-4" />
                              <h2 className="text-xl font-semibold text-white">No Blocked Users</h2>
                              <p>You haven't blocked anyone yet.</p>
                          </div>
                      )}
                      {!isLoading && blockedUsers.map(user => (
                          <div key={user.id} className="flex items-center justify-between text-white">
                              <div className="flex items-center gap-4">
                                  <Avatar>
                                      <AvatarImage src={user.photos?.[0]} className="object-cover" />
                                      <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                                  </Avatar>
                                  <span className="font-medium">{user.name}</span>
                              </div>
                              <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleUnblock(user.id)}
                                  disabled={isUnblocking === user.id}
                                  className="text-white/70 hover:text-white hover:bg-white/10"
                              >
                                  {isUnblocking === user.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <XIcon className="h-4 w-4" />}
                                  <span className="sr-only">Unblock {user.name}</span>
                              </Button>
                          </div>
                      ))}
                  </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    )
}

export function SettingsView() {
  const router = useRouter();
  const { toast } = useToast();
  const [currentUserId, setCurrentUserId] = React.useState<string | null>(null);

  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  
  const [ageRange, setAgeRange] = React.useState([18, 80]);
  const [distance, setDistance] = React.useState([50]);
  const [matchNotification, setMatchNotification] = React.useState(true);

  // Debounce the settings to avoid excessive database writes
  const debouncedAgeRange = useDebounce(ageRange, 500);
  const debouncedDistance = useDebounce(distance, 500);
  const debouncedMatchNotification = useDebounce(matchNotification, 500);

  React.useEffect(() => {
    const userId = localStorage.getItem('currentUserId');
    if (!userId) {
      router.push('/login');
    } else {
      setCurrentUserId(userId);
    }
  }, [router]);

  // Effect to fetch initial settings
  React.useEffect(() => {
    if (!currentUserId) return;

    const fetchSettings = async () => {
      setLoading(true);
      const supabase = createClient();
      const { data, error } = await supabase
        .from('profiles')
        .select('discovery_age_min, discovery_age_max, discovery_distance_km, match_notification')
        .eq('id', currentUserId)
        .single();
      
      if (error) {
        toast({ variant: 'destructive', title: 'Could not load your settings.' });
      } else if (data) {
        setAgeRange([data.discovery_age_min || 18, data.discovery_age_max || 80]);
        setDistance([data.discovery_distance_km || 50]);
        setMatchNotification(data.match_notification ?? true);
      }
      setLoading(false);
    }

    fetchSettings();
  }, [currentUserId, toast]);

  // Effect to auto-save settings on change
  React.useEffect(() => {
    if (loading || !currentUserId) return;

    const saveSettings = async () => {
        setSaving(true);
        const supabase = createClient();
        
        // Use user-provided method for IST
        const now = new Date();
        const istDate = addMinutes(now, 330);
        const formattedIST = formatISO(istDate);
        
        const { error } = await supabase
            .from('profiles')
            .update({
                discovery_age_min: debouncedAgeRange[0],
                discovery_age_max: debouncedAgeRange[1],
                discovery_distance_km: debouncedDistance[0],
                match_notification: debouncedMatchNotification,
                updated_at: formattedIST
            })
            .eq('id', currentUserId);
        
        setSaving(false);
        if (error) {
            toast({ variant: 'destructive', title: 'Error saving settings', description: error.message });
        }
    };
    
    saveSettings();
  }, [debouncedAgeRange, debouncedDistance, debouncedMatchNotification, currentUserId, loading, toast]);


  const handleLogout = () => {
    localStorage.removeItem('currentUserId');
    router.push('/');
  };
  
  if (loading) {
    return (
      <div className="container mx-auto max-w-2xl p-4">
        <h1 className="text-3xl font-bold mb-6">Settings</h1>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-4 w-3/4" />
          </CardHeader>
          <CardContent className="space-y-8 pt-6">
            <div className="space-y-4">
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-2 w-1/4 ml-auto" />
            </div>
            <div className="space-y-4">
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-2 w-1/4 ml-auto" />
            </div>
          </CardContent>
        </Card>
        <Card className="mt-6">
          <CardHeader>
             <Skeleton className="h-6 w-1/4" />
          </CardHeader>
          <CardContent className="pt-6">
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
        <Card className="mt-6">
          <CardHeader>
            <Skeleton className="h-6 w-1/4" />
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-2xl p-4">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>
      
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Discovery Settings</CardTitle>
              <CardDescription>Control who you see on RevaDates.</CardDescription>
            </div>
            {saving && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
          </div>
        </CardHeader>
        <CardContent className="space-y-8 pt-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
                <Label htmlFor="distance">Maximum Distance</Label>
                <span>{distance[0]} km</span>
            </div>
            <Slider
              id="distance"
              min={1}
              max={200}
              step={1}
              value={distance}
              onValueChange={setDistance}
            />
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
                <Label htmlFor="age-range">Age Range</Label>
                <span>{ageRange[0]} - {ageRange[1]}</span>
            </div>
            <Slider
              id="age-range"
              min={18}
              max={80}
              step={1}
              value={ageRange}
              onValueChange={setAgeRange}
            />
          </div>
        </CardContent>
      </Card>
      
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <Label htmlFor="match-notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Match Notifications
            </Label>
            <Switch
              id="match-notifications"
              checked={matchNotification}
              onCheckedChange={setMatchNotification}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
            <CardTitle>Account</CardTitle>
        </CardHeader>
        <CardContent>
            <Button variant="destructive" className="w-full justify-start gap-2" onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
                Logout
            </Button>
        </CardContent>
      </Card>
    </div>
  );
}
