
'use client';

import * as React from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Edit, Save, Upload } from 'lucide-react';
import { differenceInYears } from 'date-fns';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

type User = {
    id: string;
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
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = React.useState(false);

  const supabase = createClient();
  const { toast } = useToast();
  const router = useRouter();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setUser({ ...user, [e.target.name]: e.target.value });
  };
  
  const handleSave = async () => {
    // Here you would typically update the user data in your database
    // For now, we just exit editing mode
    const { data, error } = await supabase
        .from('profiles')
        .update({
            name: user.name,
            bio: user.bio,
            email: user.email,
            phone: user.phone,
            photos: user.photos,
        })
        .eq('id', user.id);

    if (error) {
        toast({
            variant: 'destructive',
            title: 'Error saving profile',
            description: error.message,
        });
    } else {
        toast({
            title: 'Profile Saved',
            description: 'Your profile has been updated.',
        });
        setIsEditing(false);
        router.refresh();
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const filePath = `${user.id}/${Date.now()}_${file.name}`;
    
    const { error: uploadError } = await supabase.storage
      .from('photos')
      .upload(filePath, file);

    if (uploadError) {
      toast({
        variant: 'destructive',
        title: 'Upload Failed',
        description: uploadError.message,
      });
      setUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('photos')
      .getPublicUrl(filePath);
      
    if (publicUrl) {
      const updatedPhotos = [...user.photos, publicUrl];
      setUser({ ...user, photos: updatedPhotos });
    }
    
    setUploading(false);
  };

  const age = differenceInYears(new Date(), user.dob);

  return (
    <div className="container mx-auto max-w-4xl p-4">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <CardTitle className="text-3xl">My Profile</CardTitle>
            <Button variant="ghost" size="icon" onClick={() => isEditing ? handleSave() : setIsEditing(true)}>
              {isEditing ? <Save className="h-5 w-5" /> : <Edit className="h-5 w-5" />}
              <span className="sr-only">{isEditing ? 'Save Profile' : 'Edit Profile'}</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-8">
            <div>
              <Label>Photos</Label>
              <div className="grid grid-cols-2 gap-4 mt-2">
                {user.photos.map((photo, index) => (
                  <div key={index} className="aspect-square relative rounded-lg overflow-hidden">
                    <Image src={photo} alt={`User photo ${index + 1}`} fill className="object-cover" />
                  </div>
                ))}
                {isEditing && user.photos.length < 4 && (
                  <div 
                    className="aspect-square relative rounded-lg overflow-hidden border-2 border-dashed border-muted-foreground flex items-center justify-center cursor-pointer hover:bg-muted/50"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <div className="text-center">
                        {uploading ? <p>Uploading...</p> : <Upload className="mx-auto h-8 w-8 text-muted-foreground" />}
                        <p className="text-sm text-muted-foreground mt-2">Add Photo</p>
                    </div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      onChange={handleImageUpload}
                      accept="image/*"
                      disabled={uploading}
                    />
                  </div>
                )}
              </div>
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
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
