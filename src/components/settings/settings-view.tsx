'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Shield, LogOut, Bell } from 'lucide-react';

export function SettingsView() {
  const [ageRange, setAgeRange] = React.useState([25, 40]);
  const [distance, setDistance] = React.useState([50]);

  return (
    <div className="container mx-auto max-w-2xl p-4">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Discovery Settings</CardTitle>
          <CardDescription>Control who you see on MatchMake AI.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
                <Label htmlFor="distance">Maximum Distance</Label>
                <span>{distance[0]} miles</span>
            </div>
            <Slider
              id="distance"
              min={1}
              max={100}
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
        <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
                <Label htmlFor="new-matches" className="flex items-center gap-2 cursor-pointer">
                    <Bell className="h-4 w-4" />
                    New Matches
                </Label>
                <Switch id="new-matches" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
                <Label htmlFor="new-messages" className="flex items-center gap-2 cursor-pointer">
                    <Bell className="h-4 w-4" />
                    New Messages
                </Label>
                <Switch id="new-messages" defaultChecked />
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
            <Button variant="destructive" className="w-full justify-start gap-2">
                <LogOut className="h-4 w-4" />
                Logout
            </Button>
        </CardContent>
      </Card>
    </div>
  );
}
