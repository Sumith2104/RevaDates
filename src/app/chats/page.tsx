import { AppShell } from '@/components/shared/app-shell';
import { MessageSquare } from 'lucide-react';

export default function ChatsPage() {
  return (
    <AppShell>
      <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-4">
        <MessageSquare className="h-16 w-16" />
        <h1 className="text-2xl font-bold">Your Chats</h1>
        <p>Your conversations will appear here.</p>
      </div>
    </AppShell>
  );
}
