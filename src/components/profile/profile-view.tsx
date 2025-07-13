
'use client';

import * as React from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Edit, Save, Upload, Loader2 } from 'lucide-react';
import { differenceInYears } from 'date-fns';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';

type User = {
    id: string;
    name: string;
    email: string;
    phone: string;
    dob: Date;
    photos: string[] | null;
    bio: string;
};

export function ProfileView({ user: initialUser }: { user: User }) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [user, setUser] = React.useState(initialUser);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  const supabase = createClient();
  const { toast } = useToast();
  const router = useRouter();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setUser({ ...user, [e.target.name]: e.target.value });
  };
  
  const updateUserProfile = async (updatedUser: User) => {
    setSaving(true);
    const { data, error } = await supabase
        .from('profiles')
        .update({
            name: updatedUser.name,
            bio: updatedUser.bio,
            email: updatedUser.email,
            phone: updatedUser.phone,
            photos: updatedUser.photos,
        })
        .eq('id', updatedUser.id);

    setSaving(false);
    if (error) {
        toast({
            variant: 'destructive',
            title: 'Error saving profile',
            description: error.message,
        });
        return false;
    } 
    return true;
  }
  
  const handleSave = async () => {
    const success = await updateUserProfile(user);
    if (success) {
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
    const fileExtension = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExtension}`;
    const filePath = `${user.id}/${fileName}`;
    
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
      const updatedPhotos = [...(user.photos || []), publicUrl];
      const updatedUser = { ...user, photos: updatedPhotos };
      setUser(updatedUser);
      // Immediately save the profile after successful upload
      const success = await updateUserProfile(updatedUser);
       if (success) {
        toast({
            title: 'Photo Uploaded',
            description: 'Your new photo has been added.',
        });
        router.refresh();
      }
    }
    
    setUploading(false);
  };

  const age = differenceInYears(new Date(), user.dob);
  const userPhotos = user.photos || [];

  return (
    <div className="container mx-auto max-w-4xl p-4">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <CardTitle className="text-3xl">My Profile</CardTitle>
            <Button variant="ghost" size="icon" onClick={() => isEditing ? handleSave() : setIsEditing(true)} disabled={saving}>
              {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : isEditing ? <Save className="h-5 w-5" /> : <Edit className="h-5 w-5" />}
              <span className="sr-only">{isEditing ? 'Save Profile' : 'Edit Profile'}</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-8">
            <div>
              <Label>Photos</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                {userPhotos.map((photo, index) => (
                  <div key={photo || index} className="aspect-square relative rounded-lg overflow-hidden">
                    <Image src={photo} alt={`User photo ${index + 1}`} fill className="object-cover" />
                  </div>
                ))}
                {isEditing && userPhotos.length < 4 && (
                  <div 
                    className="aspect-square relative rounded-lg overflow-hidden border-2 border-dashed border-muted-foreground flex items-center justify-center cursor-pointer hover:bg-muted/50"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <div className="text-center">
                        {uploading ? <Loader2 className="h-8 w-8 text-muted-foreground animate-spin" /> : <Upload className="mx-auto h-8 w-8 text-muted-foreground" />}
                        <p className="text-sm text-muted-foreground mt-2">{uploading ? 'Uploading...' : 'Add Photo'}</p>
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
                <Textarea id="bio" name="bio" value={user.bio || ''} onChange={handleInputChange} rows={6} placeholder="Your About Me" />
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
