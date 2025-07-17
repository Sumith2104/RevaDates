
'use client';

import * as React from 'react';
import { AppShell } from '@/components/shared/app-shell';
import { getMatches, getChats } from '@/lib/actions';
import type { Match, Chat } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils';
import { Heart, MessageSquare } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useRouter } from 'next/navigation';

function MatchItem({ match }: { match: Match }) {
    const router = useRouter();

    const navigateToChat = (matchId: string) => {
        // This would navigate to a specific chat page, e.g., /chats/[matchId]
        // For now, it just navigates to the main chats page.
        router.push('/chats'); 
    };

    return (
        <div className="flex flex-col items-center gap-2" onClick={() => navigateToChat(match.id)}>
            <Avatar className="h-16 w-16 border-2 border-primary">
                <AvatarImage src={match.matchedUser.photos?.[0]} className="object-cover" />
                <AvatarFallback>{getInitials(match.matchedUser.name)}</AvatarFallback>
            </Avatar>
            <p className="text-sm font-medium truncate">{match.matchedUser.name.split(' ')[0]}</p>
        </div>
    )
}

function ChatItem({ chat }: { chat: Chat }) {
    const router = useRouter();
    
    const navigateToChat = (matchId: string) => {
        router.push('/chats');
    };

    return (
        <div className="flex items-center gap-4 p-2 rounded-lg hover:bg-muted/50 cursor-pointer" onClick={() => navigateToChat(chat.id)}>
            <Avatar className="h-12 w-12">
                <AvatarImage src={chat.matchedUser.photos?.[0]} className="object-cover" />
                <AvatarFallback>{getInitials(chat.matchedUser.name)}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
                <div className="flex justify-between">
                    <p className="font-semibold">{chat.matchedUser.name}</p>
                    {chat.lastMessageTime && (
                       <p className="text-xs text-muted-foreground">
                         {formatDistanceToNow(new Date(chat.lastMessageTime), { addSuffix: true })}
                       </p>
                    )}
                </div>
                <p className="text-sm text-muted-foreground truncate">{chat.lastMessage}</p>
            </div>
        </div>
    )
}

export default function ChatsPage() {
    const [matches, setMatches] = React.useState<Match[]>([]);
    const [chats, setChats] = React.useState<Chat[]>([]);
    const [loadingMatches, setLoadingMatches] = React.useState(true);
    const [loadingChats, setLoadingChats] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);

    React.useEffect(() => {
        const userId = localStorage.getItem('currentUserId');
        if (!userId) {
            setError('You must be logged in.');
            setLoadingMatches(false);
            setLoadingChats(false);
            return;
        }

        async function fetchAllData() {
            setLoadingMatches(true);
            setLoadingChats(true);
            
            const [matchesResult, chatsResult] = await Promise.all([
                getMatches(userId!),
                getChats(userId!)
            ]);

            if (matchesResult.error) {
                setError(matchesResult.error);
                setMatches([]);
            } else {
                setMatches(matchesResult.data as Match[]);
            }
            setLoadingMatches(false);

            if (chatsResult.error) {
                setError(chatsResult.error);
                setChats([]);
            } else {
                setChats(chatsResult.data as Chat[]);
            }
            setLoadingChats(false);
        }

        fetchAllData();

    }, []);

    return (
        <AppShell>
            <div className="container mx-auto max-w-2xl p-4 flex-1 flex flex-col">
                <h1 className="text-3xl font-bold mb-4">Chats</h1>

                {/* New Matches Section */}
                <div>
                    <h2 className="text-xl font-semibold mb-3">From Matches</h2>
                    {loadingMatches && (
                        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="flex flex-col items-center gap-2">
                                    <Skeleton className="h-16 w-16 rounded-full" />
                                    <Skeleton className="h-4 w-12 rounded-md" />
                                </div>
                            ))}
                        </div>
                    )}
                     {!loadingMatches && matches.length === 0 && (
                        <div className="text-center text-muted-foreground py-6 bg-muted/30 rounded-lg">
                            <Heart className="mx-auto h-8 w-8 mb-2" />
                            <p className="text-sm">No new matches yet.</p>
                        </div>
                    )}
                    {!loadingMatches && matches.length > 0 && (
                        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                            {matches.map(match => <MatchItem key={match.id} match={match} />)}
                        </div>
                    )}
                </div>

                <div className="my-6 border-b border-border" />
                
                {/* Messages Section */}
                <div className="flex-1 flex flex-col">
                    <h2 className="text-xl font-semibold mb-3">Messages</h2>
                    {loadingChats && (
                        <div className="space-y-4">
                            {[...Array(3)].map((_, i) => (
                                <div key={i} className="flex items-center space-x-4">
                                    <Skeleton className="h-12 w-12 rounded-full" />
                                    <div className="space-y-2 flex-1">
                                        <Skeleton className="h-4 w-3/4" />
                                        <Skeleton className="h-4 w-1/2" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    {!loadingChats && chats.length === 0 && (
                        <div className="text-center text-muted-foreground py-10 bg-muted/30 rounded-lg flex-1 flex flex-col justify-center">
                            <MessageSquare className="mx-auto h-8 w-8 mb-2" />
                            <p className="text-sm">Start a conversation!</p>
                        </div>
                    )}
                    {!loadingChats && chats.length > 0 && (
                        <div className="space-y-2">
                             {chats.map(chat => <ChatItem key={chat.id} chat={chat} />)}
                        </div>
                    )}
                </div>
            </div>
        </AppShell>
    );
}
