
import { AppShell } from '@/components/shared/app-shell';
import { SwipeDeck } from '@/components/dashboard/swipe-deck';
import { createClient } from '@/lib/supabase/server';
import type { UserProfile } from '@/lib/types';
import { differenceInYears } from 'date-fns';

export default async function DashboardPage() {
  const supabase = createClient();

  // Fetch all profiles to ensure there's data to display
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('*');

  if (error) {
    console.error('Error fetching profiles:', error);
    // Render the deck with an empty array of users if there's an error
    return (
      <AppShell>
        <SwipeDeck users={[]} />
      </AppShell>
    );
  }

  if (!profiles || profiles.length === 0) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
          <p className="text-xl font-medium">No profiles found.</p>
          <p className="mt-2">Sign up to see more profiles!</p>
        </div>
      </AppShell>
    );
  }

  const users: UserProfile[] = profiles.map(profile => ({
    ...profile,
    age: differenceInYears(new Date(), new Date(profile.dob)),
    distance: Math.floor(Math.random() * 15) + 1, // Random distance for now
  }));

  return (
    <AppShell>
      <SwipeDeck users={users} />
    </AppShell>
  );
}
