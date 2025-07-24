
'use client';

import * as React from 'react';
import { AppShell } from '@/components/shared/app-shell';
import { getChatsAndMatches } from '@/lib/actions';
import type { Match, Chat } from '@/lib/types';
import { Heart, MessageSquare, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { MatchItem } from '@/components/chats/match-item';
import { ChatItem } from '@/components/chats/chat-item';
import { Input } from '@/components/ui/input';
import { useCurrentUser } from '@/hooks/use-current-user';
import { PageLoader } from '@/components/shared/page-loader';

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

        fetchData(true);

        const interval = setInterval(() => {
            fetchData(false);
        }, 3000);

        return () => clearInterval(interval);

    }, [userId]);
    
    const filteredChats = React.useMemo(() => {
        if (!searchTerm) {
          return chats;
        }
        return chats.filter(chat => 
          chat.matchedUser.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [chats, searchTerm]);

    if (loading || userLoading) {
        return <PageLoader />;
    }

    return (
        <AppShell>
            <div className="flex-1 flex flex-col">
                
                <div className="flex-1 flex flex-col p-4 space-y-6">
                    
                    <div>
                        <h1 className="text-3xl font-bold mb-4">New Matches</h1>
                        {matches.length === 0 ? (
                            <div className="text-center text-muted-foreground py-6 bg-muted/30 rounded-lg">
                                <Heart className="mx-auto h-8 w-8 mb-2" />
                                <p className="text-sm">No new matches yet. Keep swiping!</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto scrollbar-hide -mx-4 px-4">
                                <div className="flex gap-4 pb-4">
                                    {matches.map(match => <MatchItem key={match.id} match={match} />)}
                                </div>
                            </div>
                        )}
                    </div>

                    
                    <div className="flex-1 flex flex-col min-h-0">
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
                        {filteredChats.length === 0 ? (
                            <div className="text-center text-muted-foreground py-6 bg-muted/30 rounded-lg flex-1 flex flex-col justify-center items-center">
                                <MessageSquare className="mx-auto h-8 w-8 mb-2" />
                                <p className="text-sm">{searchTerm ? "No chats found." : "Start a conversation with a new match!"}</p>
                            </div>
                        ) : (
                            <div className="overflow-y-auto space-y-2 flex-1">
                                {filteredChats.map(chat => <ChatItem key={chat.id} chat={chat} />)}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AppShell>
    );
}
