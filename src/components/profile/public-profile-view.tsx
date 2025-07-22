
'use client';

import * as React from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { VenetianMask, MapPin } from 'lucide-react';
import { differenceInYears } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { getInitials } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { PublicProfileHeader } from './public-profile-header';
import type { UserProfile } from '@/lib/types';

interface PublicProfileViewProps {
  user: UserProfile & { dob: Date };
  currentUserId: string;
}

export function PublicProfileView({ user, currentUserId }: PublicProfileViewProps) {
  const router = useRouter();
  const age = differenceInYears(new Date(), user.dob);
  const userPhotos = user.photos || [];

  const formatDistance = (meters: number | null | undefined) => {
    if (meters === null || meters === undefined) return null;
    if (meters < 1000) {
        return `${Math.round(meters / 10) * 10} m away`;
    }
    return `${(meters / 1000).toFixed(1)} km away`;
  };

  const distanceString = formatDistance(user.distance_meters);

  return (
    <div className="flex flex-col h-full">
      <PublicProfileHeader user={user} currentUserId={currentUserId} />
      <div className="flex-1 overflow-y-auto">
        <div className="container mx-auto max-w-4xl p-4 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  {userPhotos[0] ? (
                    <AvatarImage src={userPhotos[0]} alt={user.name} width={80} height={80} className="object-cover" />
                  ) : (
                    <AvatarFallback className="bg-muted text-foreground text-2xl font-bold flex items-center justify-center">
                      {getInitials(user.name)}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div className="flex-grow">
                  <p className="text-2xl font-semibold">{user.name}, {age}</p>
                  <div className="flex flex-col gap-1 text-muted-foreground mt-1">
                      <div className="flex items-center gap-2">
                        <VenetianMask className="h-4 w-4" />
                        <p>{user.gender}</p>
                      </div>
                      {distanceString && (
                        <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            <p>{distanceString}</p>
                        </div>
                      )}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">About Me</h3>
                <p className="text-muted-foreground whitespace-pre-wrap">{user.bio || "No bio yet."}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Gallery</CardTitle>
            </CardHeader>
            <CardContent>
              {userPhotos.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {userPhotos.map((photo, index) => (
                    <div key={photo} className="aspect-square relative rounded-lg overflow-hidden group">
                      <Image src={photo} alt={`User photo ${index + 1}`} fill className="object-cover" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-10">
                  <p>This user hasn't uploaded any photos yet.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
