
'use client';

import * as React from 'react';
import { AppShell } from '@/components/shared/app-shell';
import { getMatches, getChats } from '@/lib/actions';
import type { Match, Chat } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Heart, MessageCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

function MatchList({ matches, onNavigate }: { matches: Match[]; onNavigate: (id: string, name: string) => void; }) {
    if (matches.length === 0) {
        return (
            <div className="text-center text-muted-foreground py-10">
                <Heart className="mx-auto h-12 w-12 mb-4" />
                <h2 className="text-xl font-semibold">No new matches</h2>
                <p>New matches will appear here. Keep swiping!</p>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {matches.map(match => (
                <div 
                    key={match.id} 
                    className="flex items-center gap-4 p-2 rounded-lg hover:bg-muted cursor-pointer"
                    onClick={() => onNavigate(match.id, match.matchedUser.name)}
                >
                    <Avatar className="h-12 w-12">
                        <AvatarImage src={match.matchedUser.photos?.[0]} />
                        <AvatarFallback>{getInitials(match.matchedUser.name)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-grow">
                        <p className="font-semibold">{match.matchedUser.name}</p>
                    </div>
                </div>
            ))}
        </div>
    )
}

function ChatList({ chats, onNavigate }: { chats: Chat[]; onNavigate: (id: string, name: string) => void; }) {
     if (chats.length === 0) {
        return (
            <div className="text-center text-muted-foreground py-10">
                <MessageCircle className="mx-auto h-12 w-12 mb-4" />
                <h2 className="text-xl font-semibold">No active chats</h2>
                <p>Your conversations will appear here once you start chatting.</p>
            </div>
        )
    }
    return (
        <div className="space-y-4">
            {chats.map(chat => (
                <div 
                    key={chat.id} 
                    className="flex items-center gap-4 p-2 rounded-lg hover:bg-muted cursor-pointer"
                    onClick={() => onNavigate(chat.id, chat.matchedUser.name)}
                >
                    <Avatar className="h-12 w-12">
                        <AvatarImage src={chat.matchedUser.photos?.[0]} />
                        <AvatarFallback>{getInitials(chat.matchedUser.name)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-grow">
                        <div className="flex justify-between items-start">
                            <p className="font-semibold">{chat.matchedUser.name}</p>
                            <p className="text-xs text-muted-foreground">{chat.lastMessageTime}</p>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">{chat.lastMessage}</p>
                    </div>
                </div>
            ))}
        </div>
    )
}


export default function ChatsPage() {
    const router = useRouter();
    const [matches, setMatches] = React.useState<Match[]>([]);
    const [chats, setChats] = React.useState<Chat[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);

    React.useEffect(() => {
        const userId = localStorage.getItem('currentUserId');
        if (!userId) {
            setError('You must be logged in to see your chats.');
            setLoading(false);
            return;
        }

        const fetchData = async () => {
            setLoading(true);
            const [matchesResult, chatsResult] = await Promise.all([
                getMatches(userId),
                getChats(userId)
            ]);

            if (matchesResult.error || chatsResult.error) {
                setError(matchesResult.error || chatsResult.error || 'Could not load your connections.');
            } else {
                setMatches(matchesResult.data as Match[]);
                setChats(chatsResult.data as Chat[]);
            }
            setLoading(false);
        };

        fetchData();
        
        const supabase = createClient();
        const channel = supabase.channel('realtime-chats')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'matches' }, fetchData)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, fetchData)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'swipes' }, fetchData)
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };

    }, []);

    const handleNavigation = (matchId: string, name: string) => {
        // This is a placeholder for navigating to a specific chat
        // In a real app, you would navigate to `/chats/${matchId}`
        router.push('/chats'); 
        console.log(`Navigating to chat with ${name} (match ID: ${matchId})`);
    };

    return (
        <AppShell>
            <div className="container mx-auto max-w-2xl p-4 flex-1 flex flex-col">
                <h1 className="text-3xl font-bold mb-4">Chats</h1>
                <Tabs defaultValue="matches" className="flex-1 flex flex-col">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="matches">Matches</TabsTrigger>
                        <TabsTrigger value="chats">Chats</TabsTrigger>
                    </TabsList>
                    <TabsContent value="matches" className="flex-1 overflow-y-auto mt-4">
                        {loading && (
                            <div className="space-y-4">
                                {[...Array(3)].map((_, i) => (
                                    <div key={i} className="flex items-center space-x-4">
                                        <Skeleton className="h-12 w-12 rounded-full" />
                                        <div className="space-y-2">
                                            <Skeleton className="h-4 w-[150px]" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        {!loading && !error && <MatchList matches={matches} onNavigate={handleNavigation} />}
                    </TabsContent>
                    <TabsContent value="chats" className="flex-1 overflow-y-auto mt-4">
                         {loading && (
                            <div className="space-y-4">
                                {[...Array(4)].map((_, i) => (
                                    <div key={i} className="flex items-center space-x-4">
                                        <Skeleton className="h-12 w-12 rounded-full" />
                                        <div className="space-y-2 flex-grow">
                                            <Skeleton className="h-4 w-[150px]" />
                                            <Skeleton className="h-4 w-full" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        {!loading && !error && <ChatList chats={chats} onNavigate={handleNavigation} />}
                    </TabsContent>
                </Tabs>
                {error && (
                    <div className="text-center text-destructive-foreground py-10">
                        <p>{error}</p>
                    </div>
                )}
            </div>
        </AppShell>
    );
}
