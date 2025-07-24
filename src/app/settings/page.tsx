
'use client';

import { AppShell } from '@/components/shared/app-shell';
import { SettingsView } from '@/components/settings/settings-view';
import { useCurrentUser } from '@/hooks/use-current-user';
import { PageLoader } from '@/components/shared/page-loader';

export default function SettingsPage() {
  const { user, loading } = useCurrentUser();

  if (loading || !user) {
    return <PageLoader />;
  }

  return (
    <AppShell>
      <SettingsView userId={user} />
    </AppShell>
  );
}
