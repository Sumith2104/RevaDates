
'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Shield, LogOut, Loader2, Bell } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { useDebounce } from '@/hooks/use-debounce';

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
        console.error('Error fetching settings:', error);
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
        const { error } = await supabase
            .from('profiles')
            .update({
                discovery_age_min: debouncedAgeRange[0],
                discovery_age_max: debouncedAgeRange[1],
                discovery_distance_km: debouncedDistance[0],
                match_notification: debouncedMatchNotification,
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
            <Separator />
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
        <CardContent className="space-y-8">
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
        <CardContent className="space-y-4">
            <Button variant="outline" className="w-full justify-start gap-2">
                <Shield className="h-4 w-4" />
                Blocked Users
            </Button>
            <Separator />
            <Button variant="destructive" className="w-full justify-start gap-2" onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
                Logout
            </Button>
        </CardContent>
      </Card>
    </div>
  );
}

