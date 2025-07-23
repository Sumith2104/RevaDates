
'use client';

import * as React from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Edit, Save, Upload, Loader2, Shield, Heart, UserX, MessageSquare, Trash2, Star, VenetianMask } from 'lucide-react';
import { differenceInYears } from 'date-fns';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import { BlockedUsersDialog } from '../settings/settings-view';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { DialogTrigger } from "@radix-ui/react-dialog"
import { getChatsAndMatches, updateUserProfile, updateUserProfilePhotos } from '@/lib/actions';
import type { Match } from '@/lib/types';
import { Skeleton } from '../ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { getInitials } from '@/lib/utils';
import { ScrollArea } from '../ui/scroll-area';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { cn } from "@/lib/utils"


type User = {
    id: string;
    name: string;
    email: string;
    phone: string;
    dob: Date;
    photos: string[] | null;
    bio: string;
    gender: string;
    updated_at: string;
};

function MatchesDialog({ userId }: { userId: string }) {
    const [matches, setMatches] = React.useState<Match[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const { toast } = useToast();
    const router = useRouter();

    const fetchMatches = React.useCallback(async () => {
        setIsLoading(true);
        const result = await getChatsAndMatches(userId);
        if (result.error) {
            toast({ variant: 'destructive', title: 'Could Not Load Matches', description: result.error });
            setMatches([]);
        } else {
            setMatches(result.matches as Match[]);
        }
        setIsLoading(false);
    }, [userId, toast]);
    
    const navigateToChat = (matchId: string) => {
        router.push('/chats'); 
    };

    return (
        <Dialog onOpenChange={(open) => open && fetchMatches()}>
            <DialogTrigger asChild>
                <Button variant="outline" className="w-full justify-start gap-2">
                    <Heart className="h-4 w-4" />
                    My Matches
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-white/10 backdrop-blur-lg shadow-2xl rounded-lg">
                <DialogHeader>
                    <DialogTitle className="text-white">My Matches</DialogTitle>
                    <DialogDescription className="text-white/70">
                        These are the people you have mutually liked.
                    </DialogDescription>
                </DialogHeader>
                <ScrollArea className="max-h-[400px] pr-4">
                  <div className="space-y-4 py-4 text-white">
                      {isLoading && (
                           [...Array(3)].map((_, i) => (
                              <div key={i} className="flex items-center space-x-4">
                                  <Skeleton className="h-12 w-12 rounded-full bg-white/20" />
                                  <div className="space-y-2">
                                      <Skeleton className="h-4 w-[150px] bg-white/20" />
                                  </div>
                              </div>
                           ))
                      )}
                      {!isLoading && matches.length === 0 && (
                          <div className="text-center text-white/70 py-10">
                              <Heart className="mx-auto h-12 w-12 mb-4" />
                              <h2 className="text-xl font-semibold text-white">No Matches Yet</h2>
                              <p>Keep swiping to find your perfect match!</p>
                          </div>
                      )}
                      {!isLoading && matches.map(match => (
                          <div 
                            key={match.id} 
                            className="flex items-center justify-between text-white p-2 rounded-md hover:bg-white/10 cursor-pointer"
                            onClick={() => navigateToChat(match.id)}
                          >
                              <div className="flex items-center gap-4">
                                  <Avatar>
                                      {match.matchedUser.photos?.[0] && (
                                        <AvatarImage src={match.matchedUser.photos[0]} alt={match.matchedUser.name} width={48} height={48} className="object-cover" />
                                      )}
                                      <AvatarFallback>{getInitials(match.matchedUser.name)}</AvatarFallback>
                                  </Avatar>
                                  <span className="font-medium">{match.matchedUser.name}</span>
                              </div>
                              <MessageSquare className="h-5 w-5 text-white/70" />
                          </div>
                      ))}
                  </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    )
}

export function ProfileView({ user: initialUser }: { user: User }) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [user, setUser] = React.useState(initialUser);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [deletingPhoto, setDeletingPhoto] = React.useState<string | null>(null);

  const supabase = createClient();
  const { toast } = useToast();
  const router = useRouter();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setUser({ ...user, [e.target.name]: e.target.value });
  };
  
  const handleSave = async () => {
    setSaving(true);
    const result = await updateUserProfile(user.id, {
      name: user.name,
      bio: user.bio,
      email: user.email,
      phone: user.phone,
    });
    setSaving(false);

    if (result.error) {
        toast({
            variant: 'destructive',
            title: 'Could Not Save Profile',
            description: result.error,
        });
    } else {
        toast({
            title: 'Profile Saved',
            description: 'Your profile has been updated successfully.',
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
      const updatedPhotos = [publicUrl, ...(user.photos || [])];
      setUser(prev => ({...prev, photos: updatedPhotos}));
      const result = await updateUserProfilePhotos(user.id, updatedPhotos);
       if (!result.error) {
        toast({
            title: 'Photo Uploaded',
            description: 'Your new photo is now your primary one.',
        });
        router.refresh();
      } else {
        toast({
            variant: 'destructive',
            title: 'Could Not Save Photo',
            description: result.error,
        });
      }
    }
    
    setUploading(false);
  };

  const handleSetAsPrimary = async (photoToMakePrimary: string) => {
    if (!user.photos) return;
    const currentPhotos = [...user.photos];
    const newPrimaryIndex = currentPhotos.findIndex(p => p === photoToMakePrimary);
    if (newPrimaryIndex <= 0) return; // It's already primary or not found

    const newPrimaryPhoto = currentPhotos.splice(newPrimaryIndex, 1)[0];
    const newPhotoOrder = [newPrimaryPhoto, ...currentPhotos];
    
    setUser(prev => ({...prev, photos: newPhotoOrder}));
    const result = await updateUserProfilePhotos(user.id, newPhotoOrder);
    if (!result.error) {
        toast({ title: 'Main Photo Updated', description: "Your primary photo has been changed." });
        router.refresh();
    } else {
        setUser(prev => ({...prev, photos: user.photos})); // Revert on failure
        toast({
            variant: 'destructive',
            title: 'Update Failed',
            description: result.error,
        });
    }
  }

  const handleDeletePhoto = async () => {
    if (!deletingPhoto || !user.photos) return;

    // 1. Extract file path from the URL for storage deletion
    const filePath = deletingPhoto.split('/photos/').pop();
    if (!filePath) {
        toast({ variant: 'destructive', title: 'Error', description: 'Could not determine file path.' });
        return;
    }

    // 2. Delete the file from Supabase Storage
    const { error: storageError } = await supabase.storage.from('photos').remove([filePath]);
    if (storageError) {
        toast({ variant: 'destructive', title: 'Storage Error', description: `Could not delete photo from storage: ${storageError.message}` });
        setDeletingPhoto(null);
        return;
    }

    // 3. Update the photos array in the user's profile
    const newPhotoList = user.photos.filter(p => p !== deletingPhoto);
    const result = await updateUserProfilePhotos(user.id, newPhotoList);
    
    if (!result.error) {
        toast({ title: 'Photo Removed' });
        setUser(prev => ({ ...prev, photos: newPhotoList }));
        router.refresh();
    } else {
        toast({
            variant: 'destructive',
            title: 'Could Not Remove Photo',
            description: result.error,
        });
        // Note: If this fails, the file is deleted but the profile is not updated.
        // A more robust solution might involve a retry mechanism or a cleanup job.
    }
    
    setDeletingPhoto(null);
  }

  const age = differenceInYears(new Date(), user.dob);
  const userPhotos = user.photos || [];

  return (
    <>
    <div className="container mx-auto max-w-4xl p-4 space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <CardTitle className="text-3xl">My Profile</CardTitle>
            <Button variant="ghost" size="icon" onClick={() => isEditing ? handleSave() : setIsEditing(true)} disabled={saving}>
              {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : isEditing ? <Save className="h-5 w-5" /> : <Edit className="h-5 w-5" />}
              <span className="sr-only">{isEditing ? 'Save Profile' : 'Edit Profile'}</span>
            </Button>
          </div>
           <div className="flex items-center gap-4 pt-4">
                <Avatar className="h-20 w-20">
                  {userPhotos[0] && (
                    <AvatarImage src={userPhotos[0]} alt={user.name} width={80} height={80} className="object-cover" />
                  )}
                  <AvatarFallback className="bg-muted text-foreground text-2xl font-bold flex items-center justify-center">
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-grow">
                    {isEditing ? (
                        <Input name="name" value={user.name} onChange={handleInputChange} className="text-xl" placeholder="Your Name" />
                    ) : (
                        <p className="text-2xl font-semibold">{user.name}, {age}</p>
                    )}
                     <div className="flex items-center gap-2 text-muted-foreground mt-1">
                        <VenetianMask className="h-4 w-4" />
                        <p>{user.gender}</p>
                     </div>
                </div>
            </div>
        </CardHeader>
        <CardContent className="space-y-6">
            <div>
              <Label htmlFor="bio">About Me</Label>
              {isEditing ? (
                <Textarea id="bio" name="bio" value={user.bio || ''} onChange={handleInputChange} rows={6} placeholder="Tell us about yourself..." />
              ) : (
                <p className="text-muted-foreground whitespace-pre-wrap">{user.bio}</p>
              )}
            </div>
            {isEditing && (
              <>
                <div>
                  <Label>Email</Label>
                  <Input name="email" type="email" value={user.email || ''} onChange={handleInputChange} placeholder="Your Email" />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input name="phone" type="tel" value={user.phone || ''} onChange={handleInputChange} placeholder="Your Phone" />
                </div>
              </>
            )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>My Gallery</CardTitle>
        </CardHeader>
        <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {userPhotos.map((photo, index) => (
                <div key={photo} className="aspect-square relative rounded-lg overflow-hidden group">
                <Image src={photo} alt={`User photo ${index + 1}`} fill className="object-cover" />
                {isEditing && (
                    <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {index > 0 && (
                        <Button size="sm" variant="outline" className="bg-black/50 text-white hover:bg-black/70 border-white/50" onClick={() => handleSetAsPrimary(photo)}>
                            <Star className="h-4 w-4 mr-2" />
                        Primary
                        </Button>
                        )}
                        <Button size="sm" variant="destructive" className="bg-red-800/80" onClick={() => setDeletingPhoto(photo)}>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                        </Button>
                    </div>
                )}
                {index === 0 && (
                    <div className="absolute top-2 left-2 bg-primary text-primary-foreground px-2 py-1 text-xs font-bold rounded">
                        MAIN
                    </div>
                )}
                </div>
            ))}
            {isEditing && userPhotos.length < 8 && (
                <div 
                className={cn(
                    "aspect-square relative rounded-lg overflow-hidden border-2 border-dashed border-muted-foreground flex items-center justify-center cursor-pointer hover:bg-muted/50",
                    uploading && "cursor-not-allowed opacity-50"
                )}
                onClick={() => !uploading && fileInputRef.current?.click()}
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
        </CardContent>
      </Card>

      <Card>
          <CardHeader>
              <CardTitle>Connections</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
              <MatchesDialog userId={user.id} />
              <BlockedUsersDialog userId={user.id} />
          </CardContent>
      </Card>
    </div>
    <AlertDialog open={!!deletingPhoto} onOpenChange={(open) => !open && setDeletingPhoto(null)}>
        <AlertDialogContent className="w-full max-w-[330px] rounded-lg p-6 text-center shadow-2xl bg-white/10 backdrop-blur-lg">
            <AlertDialogHeader className="text-center sm:text-center">
                <AlertDialogTitle className="text-white text-lg font-semibold">Delete Photo?</AlertDialogTitle>
                <AlertDialogDescription className="text-sm text-white/70 mt-2">
                    Are you sure you want to delete this photo? This action cannot be undone.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="mt-6 flex flex-row sm:justify-center justify-center gap-4">
                <AlertDialogAction onClick={handleDeletePhoto} className="w-28 bg-red-700 hover:bg-red-800 text-white px-6 py-2 rounded-full shadow-md">Delete</AlertDialogAction>
                <AlertDialogCancel onClick={() => setDeletingPhoto(null)} className="w-28 bg-white hover:bg-gray-100 hover:text-black text-black px-6 py-2 rounded-full shadow-md mt-0">Cancel</AlertDialogCancel>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    </>
  );
}

