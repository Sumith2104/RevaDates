
import { AppShell } from '@/components/shared/app-shell';
import { ProfileView } from '@/components/profile/profile-view';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function ProfilePage() {
  const supabase = createClient();
  
  // For now, we'll hardcode the user ID. In a real app, you'd get this from the session.
  const userId = '11111111-1111-1111-1111-111111111111';

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error || !profile) {
    // If no profile, maybe redirect to a setup page or show an error
    // For now, we'll just show a simple message or redirect
    console.error('Profile fetch error:', error);
    // This is a placeholder user. A real app should handle this more gracefully.
    const currentUser = {
        id: '0',
        name: 'New User',
        email: 'new@example.com',
        phone: '555-0100',
        dob: new Date(),
        photos: [],
        bio: 'Welcome! Please fill out your profile.',
    };
     return (
        <AppShell>
            <ProfileView user={{...currentUser, dob: new Date(currentUser.dob)}} />
        </AppShell>
     );
  }
  
  const user = {
    ...profile,
    dob: new Date(profile.dob), // Ensure dob is a Date object
  };

  return (
    <AppShell>
      <ProfileView user={user} />
    </AppShell>
  );
}
