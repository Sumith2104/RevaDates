
'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Shield, LogOut, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

export function SettingsView() {
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();
  const [currentUserId, setCurrentUserId] = React.useState<string | null>(null);

  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  
  const [ageRange, setAgeRange] = React.useState([18, 80]);
  const [distance, setDistance] = React.useState([50]);

  React.useEffect(() => {
    const userId = localStorage.getItem('currentUserId');
    if (!userId) {
      router.push('/login');
    } else {
      setCurrentUserId(userId);
    }
  }, [router]);

  React.useEffect(() => {
    if (!currentUserId) return;

    const fetchSettings = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('discovery_age_min, discovery_age_max, discovery_distance_km')
        .eq('id', currentUserId)
        .single();
      
      if (error) {
        console.error('Error fetching settings:', error);
        toast({ variant: 'destructive', title: 'Could not load your settings.' });
      } else if (data) {
        setAgeRange([data.discovery_age_min || 18, data.discovery_age_max || 80]);
        setDistance([data.discovery_distance_km || 50]);
      }
      setLoading(false);
    }

    fetchSettings();
  }, [currentUserId, supabase, toast]);

  const handleSaveSettings = async () => {
    if (!currentUserId) return;
    setSaving(true);

    const { error } = await supabase
        .from('profiles')
        .update({
            discovery_age_min: ageRange[0],
            discovery_age_max: ageRange[1],
            discovery_distance_km: distance[0],
        })
        .eq('id', currentUserId);

    setSaving(false);
    if (error) {
        toast({ variant: 'destructive', title: 'Error saving settings', description: error.message });
    } else {
        toast({ title: 'Settings Saved!', description: 'Your discovery preferences have been updated.' });
    }
  };

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
                <CardContent className="space-y-8">
                    <div className="space-y-4">
                        <Skeleton className="h-4 w-1/4" />
                        <Skeleton className="h-5 w-full" />
                    </div>
                     <div className="space-y-4">
                        <Skeleton className="h-4 w-1/4" />
                        <Skeleton className="h-5 w-full" />
                    </div>
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
            <Button onClick={handleSaveSettings} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save
            </Button>
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
