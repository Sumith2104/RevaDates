
'use client';

import * as React from 'react';
import { AppShell } from '@/components/shared/app-shell';
import { getChatsAndMatches } from '@/lib/actions';
import type { Match, Chat } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Heart, MessageSquare, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { MatchItem } from '@/components/chats/match-item';
import { ChatItem } from '@/components/chats/chat-item';
import { Input } from '@/components/ui/input';
import { useCurrentUser } from '@/hooks/use-current-user';

export default function ChatsPage() {
    const { user: userId, loading: userLoading } = useCurrentUser();
    const [matches, setMatches] = React.useState<Match[]>([]);
    const [chats, setChats] = React.useState<Chat[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    const [searchTerm, setSearchTerm] = React.useState('');
    const router = useRouter();

    React.useEffect(() => {
        if (!userId) {
            return;
        }

        async function fetchData(initialLoad = false) {
            // This check ensures we never call the action with a null userId.
            if (!userId) {
                if(initialLoad) setLoading(false);
                return;
            }

            if(initialLoad) setLoading(true);
            
            const result = await getChatsAndMatches(userId);
            
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
        }, 3000); // Refresh every 3 seconds

        return () => clearInterval(interval); // Cleanup on component unmount

    }, [userId]);
    
    const filteredChats = React.useMemo(() => {
        if (!searchTerm) {
          return chats;
        }
        return chats.filter(chat => 
          chat.matchedUser.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [chats, searchTerm]);

    return (
        <AppShell>
            <div className="container mx-auto max-w-2xl p-4 flex-1 flex flex-col">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold mb-4">New Matches</h1>
                    {(loading || userLoading) && (
                        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="flex flex-col items-center gap-2">
                                    <Skeleton className="h-16 w-16 rounded-full" />
                                    <Skeleton className="h-4 w-12 rounded-md" />
                                </div>
                            ))}
                        </div>
                    )}
                     {!(loading || userLoading) && matches.length === 0 && (
                        <div className="text-center text-muted-foreground py-6 bg-muted/30 rounded-lg">
                            <Heart className="mx-auto h-8 w-8 mb-2" />
                            <p className="text-sm">No new matches yet. Keep swiping!</p>
                        </div>
                    )}
                    {!(loading || userLoading) && matches.length > 0 && (
                        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                            {matches.map(match => <MatchItem key={match.id} match={match} />)}
                        </div>
                    )}
                </div>

                <div className="flex-1 flex flex-col">
                    <div className="flex justify-between items-center mb-4">
                        <h1 className="text-3xl font-bold">Messages</h1>
                    </div>
                     <div className="relative mb-4">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input
                            placeholder="Search chats..."
                            className="pl-10 w-full"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    {(loading || userLoading) && (
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
                    {!(loading || userLoading) && filteredChats.length === 0 && (
                         <div className="text-center text-muted-foreground py-6 bg-muted/30 rounded-lg flex-1 flex flex-col justify-center items-center">
                            <MessageSquare className="mx-auto h-8 w-8 mb-2" />
                            <p className="text-sm">{searchTerm ? "No chats found." : "Start a conversation with a new match!"}</p>
                        </div>
                    )}
                    {!(loading || userLoading) && filteredChats.length > 0 && (
                        <div className="space-y-2">
                            {filteredChats.map(chat => <ChatItem key={chat.id} chat={chat} />)}
                        </div>
                    )}

                </div>
            </div>
        </AppShell>
    );
}
