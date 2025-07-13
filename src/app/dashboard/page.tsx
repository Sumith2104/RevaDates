
import { AppShell } from '@/components/shared/app-shell';
import { SwipeDeck } from '@/components/dashboard/swipe-deck';
import { createClient } from '@/lib/supabase/server';
import type { UserProfile } from '@/lib/types';
import { differenceInYears } from 'date-fns';

export default async function DashboardPage() {
  const supabase = createClient();
  const currentUserId = '11111111-1111-1111-1111-111111111111';

  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('*')
    .neq('id', currentUserId);

  if (error) {
    console.error('Error fetching profiles:', error);
    // Render the deck with an empty array of users if there's an error
    return (
      <AppShell>
        <SwipeDeck users={[]} />
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
