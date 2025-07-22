
'use client';

import * as React from 'react';
import { AppShell } from '@/components/shared/app-shell';
import { getChatsAndMatches } from '@/lib/actions';
import type { Match, Chat } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Heart, MessageSquare } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { MatchItem } from '@/components/chats/match-item';
import { ChatItem } from '@/components/chats/chat-item';


export default function ChatsPage() {
    const [matches, setMatches] = React.useState<Match[]>([]);
    const [chats, setChats] = React.useState<Chat[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    const router = useRouter();

    React.useEffect(() => {
        const userId = localStorage.getItem('currentUserId');
        if (!userId) {
            router.push('/login');
            return;
        }

        async function fetchData(initialLoad = false) {
            if(initialLoad) setLoading(true);
            
            const result = await getChatsAndMatches(userId!);
            
            if (result.error) {
                setError(result.error);
                setMatches([]);
                setChats([]);
            } else {
                setMatches(result.matches as Match[]);
                setChats(result.chats as Chat[]);
            }
            if(initialLoad) setLoading(false);
        }

        fetchData(true); // Initial fetch with loading state

        const interval = setInterval(() => {
            fetchData(false); // Subsequent fetches without loading state
        }, 1000); // Refresh every 1 second

        return () => clearInterval(interval); // Cleanup on component unmount

    }, [router]);

    return (
        <AppShell>
            <div className="container mx-auto max-w-2xl p-4 flex-1 flex flex-col">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold mb-4">New Matches</h1>
                    {loading && (
                        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="flex flex-col items-center gap-2">
                                    <Skeleton className="h-16 w-16 rounded-full" />
                                    <Skeleton className="h-4 w-12 rounded-md" />
                                </div>
                            ))}
                        </div>
                    )}
                     {!loading && matches.length === 0 && (
                        <div className="text-center text-muted-foreground py-6 bg-muted/30 rounded-lg">
                            <Heart className="mx-auto h-8 w-8 mb-2" />
                            <p className="text-sm">No new matches yet. Keep swiping!</p>
                        </div>
                    )}
                    {!loading && matches.length > 0 && (
                        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                            {matches.map(match => <MatchItem key={match.id} match={match} />)}
                        </div>
                    )}
                </div>

                <div className="flex-1 flex flex-col">
                    <h1 className="text-3xl font-bold mb-4">Messages</h1>
                    {loading && (
                         <div className="space-y-4">
                            {[...Array(3)].map((_, i) => (
                                <div key={i} className="flex items-center space-x-4">
                                    <Skeleton className="h-12 w-12 rounded-full" />
                                    <div className="space-y-2">
                                        <Skeleton className="h-4 w-[200px]" />
                                        <Skeleton className="h-4 w-[150px]" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    {!loading && chats.length === 0 && (
                         <div className="text-center text-muted-foreground py-6 bg-muted/30 rounded-lg flex-1 flex flex-col justify-center items-center">
                            <MessageSquare className="mx-auto h-8 w-8 mb-2" />
                            <p className="text-sm">Start a conversation with a new match!</p>
                        </div>
                    )}
                    {!loading && chats.length > 0 && (
                        <div className="space-y-2">
                            {chats.map(chat => <ChatItem key={chat.id} chat={chat} />)}
                        </div>
                    )}

                </div>
            </div>
        </AppShell>
    );
}
