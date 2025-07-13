'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Wand2, Edit, Save } from 'lucide-react';
import { differenceInYears } from 'date-fns';

type User = {
    name: string;
    email: string;
    phone: string;
    dob: Date;
    photos: string[];
    bio: string;
};

export function ProfileView({ user: initialUser }: { user: User }) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [user, setUser] = React.useState(initialUser);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setUser({ ...user, [e.target.name]: e.target.value });
  };
  
  const age = differenceInYears(new Date(), user.dob);

  return (
    <div className="container mx-auto max-w-4xl p-4">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <CardTitle className="text-3xl">My Profile</CardTitle>
            <Button variant="ghost" size="icon" onClick={() => setIsEditing(!isEditing)}>
              {isEditing ? <Save className="h-5 w-5" /> : <Edit className="h-5 w-5" />}
              <span className="sr-only">{isEditing ? 'Save Profile' : 'Edit Profile'}</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-8">
          <div className="grid grid-cols-2 gap-4 h-fit">
            {user.photos.map((photo, index) => (
              <div key={index} className="aspect-square relative rounded-lg overflow-hidden">
                <Image src={photo} alt={`User photo ${index + 1}`} fill className="object-cover" data-ai-hint="person profile photo" />
              </div>
            ))}
          </div>
          <div className="space-y-6">
            <div>
              <Label>Name</Label>
              {isEditing ? (
                <Input name="name" value={user.name} onChange={handleInputChange} className="text-lg" placeholder="Your Name" />
              ) : (
                <p className="text-2xl font-semibold">{user.name}, {age}</p>
              )}
            </div>
            <div>
              <Label htmlFor="bio">About Me</Label>
              {isEditing ? (
                <Textarea id="bio" name="bio" value={user.bio} onChange={handleInputChange} rows={6} placeholder="Your About Me" />
              ) : (
                <p className="text-muted-foreground whitespace-pre-wrap">{user.bio}</p>
              )}
            </div>
            {isEditing && (
              <>
                <div>
                  <Label>Email</Label>
                  <Input name="email" type="email" value={user.email} onChange={handleInputChange} placeholder="Your Email" />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input name="phone" type="tel" value={user.phone} onChange={handleInputChange} placeholder="Your Phone" />
                </div>
              </>
            )}
            <Button asChild className="w-full" variant="outline">
              <Link href="/profile/ai-assist">
                <Wand2 className="mr-2 h-4 w-4" />
                Get AI Profile Suggestions
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
