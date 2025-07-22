
'use client';

import { AppShell } from '@/components/shared/app-shell';
import { SettingsView } from '@/components/settings/settings-view';
import { useCurrentUser } from '@/hooks/use-current-user';
import { Skeleton } from '@/components/ui/skeleton';

export default function SettingsPage() {
  const { user, loading } = useCurrentUser();

  if (loading || !user) {
    return (
      <AppShell>
        <div className="container mx-auto max-w-2xl p-4">
            <Skeleton className="h-8 w-1/3 mb-6" />
            <div className="space-y-6">
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-24 w-full" />
            </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <SettingsView userId={user} />
    </AppShell>
  );
}

    