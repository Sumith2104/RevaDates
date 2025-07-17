import { BottomNav } from './bottom-nav';

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen bg-black">
      <main className="flex-1 flex flex-col pb-16 md:pb-0">{children}</main>
      <BottomNav />
    </div>
  );
}
