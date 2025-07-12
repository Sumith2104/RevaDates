import { AppShell } from '@/components/shared/app-shell';
import { SwipeDeck } from '@/components/dashboard/swipe-deck';
import { mockUsers } from '@/lib/mock-data';

export default function DashboardPage() {
  return (
    <AppShell>
      <SwipeDeck users={mockUsers} />
    </AppShell>
  );
}
