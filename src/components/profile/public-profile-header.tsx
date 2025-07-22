
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ShieldAlert } from 'lucide-react';
import type { UserProfile } from '@/lib/types';
import { blockUser } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
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

interface PublicProfileHeaderProps {
  user: UserProfile;
  currentUserId: string;
}

export function PublicProfileHeader({ user, currentUserId }: PublicProfileHeaderProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isBlockConfirmOpen, setIsBlockConfirmOpen] = React.useState(false);

  const handleBlock = async () => {
    const result = await blockUser(currentUserId, user.id);
    if (result.error) {
        toast({
            variant: 'destructive',
            title: 'Could Not Block User',
            description: result.error,
        });
    } else {
        toast({
            title: 'User Blocked',
            description: `You will no longer see ${user.name}'s profile.`,
        });
        router.push('/dashboard');
    }
    setIsBlockConfirmOpen(false);
  }

  return (
    <>
      <header className="sticky top-0 z-10 flex items-center justify-between gap-4 p-2 border-b bg-background/80 backdrop-blur-sm">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <div className="flex-1 text-center">
            <h2 className="font-semibold text-lg truncate">{user.name}</h2>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setIsBlockConfirmOpen(true)}>
          <ShieldAlert className="h-6 w-6" />
        </Button>
      </header>

      <AlertDialog open={isBlockConfirmOpen} onOpenChange={setIsBlockConfirmOpen}>
          <AlertDialogContent className="w-full max-w-[330px] rounded-lg p-6 text-center shadow-2xl bg-white/10 backdrop-blur-lg">
              <AlertDialogHeader className="text-center sm:text-center">
                  <AlertDialogTitle className="text-white text-lg font-semibold">Block {user.name}?</AlertDialogTitle>
                  <AlertDialogDescription className="text-sm text-white/70 mt-2">
                      Are you sure? You won't see their profile again and this cannot be undone.
                  </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="mt-6 flex flex-row sm:justify-center justify-center gap-4">
                  <AlertDialogAction onClick={handleBlock} className="w-28 bg-red-700 hover:bg-red-800 text-white px-6 py-2 rounded-full shadow-md">Block</AlertDialogAction>
                  <AlertDialogCancel onClick={() => setIsBlockConfirmOpen(false)} className="w-28 bg-white hover:bg-gray-100 hover:text-black text-black px-6 py-2 rounded-full shadow-md mt-0">Cancel</AlertDialogCancel>
              </AlertDialogFooter>
          </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
