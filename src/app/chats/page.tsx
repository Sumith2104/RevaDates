
'use client';

import * as React from 'react';
import { AppShell } from '@/components/shared/app-shell';
import { getMatches } from '@/lib/actions';
import type { Match } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils';
import { Heart } from 'lucide-react';
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

export default function ChatsPage() {
    const [matches, setMatches] = React.useState<Match[]>([]);
    const [loadingMatches, setLoadingMatches] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);

    React.useEffect(() => {
        const userId = localStorage.getItem('currentUserId');
        if (!userId) {
            setError('You must be logged in.');
            setLoadingMatches(false);
            return;
        }

        async function fetchMatchesData() {
            setLoadingMatches(true);
            
            const matchesResult = await getMatches(userId!);
            
            if (matchesResult.error) {
                setError(matchesResult.error);
                setMatches([]);
            } else {
                setMatches(matchesResult.data as Match[]);
            }
            setLoadingMatches(false);
        }

        fetchMatchesData();

    }, []);

    return (
        <AppShell>
            <div className="container mx-auto max-w-2xl p-4 flex-1 flex flex-col">
                <h1 className="text-3xl font-bold mb-4">New Matches</h1>

                {/* New Matches Section */}
                <div>
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
                            <p className="text-sm">No new matches yet. Keep swiping!</p>
                        </div>
                    )}
                    {!loadingMatches && matches.length > 0 && (
                        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                            {matches.map(match => <MatchItem key={match.id} match={match} />)}
                        </div>
                    )}
                </div>
            </div>
        </AppShell>
    );
}
