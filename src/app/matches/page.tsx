
'use client';

import * as React from 'react';
import { AppShell } from '@/components/shared/app-shell';
import { getMatches } from '@/lib/actions';
import { Skeleton } from '@/components/ui/skeleton';
import { HeartCrack } from 'lucide-react';
import type { Match } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { useRouter } from 'next/navigation';

export default function MatchesPage() {
    const [matches, setMatches] = React.useState<Match[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    const router = useRouter();

    React.useEffect(() => {
        const userId = localStorage.getItem('currentUserId');
        if (!userId) {
            setError('You must be logged in to see your matches.');
            setLoading(false);
            return;
        }

        const fetchMatches = async () => {
            setLoading(true);
            const result = await getMatches(userId);
            if (result.error) {
                setError(result.error);
            } else {
                setMatches(result.data as Match[]);
            }
            setLoading(false);
        };

        fetchMatches();
    }, []);
    
    const navigateToChat = (matchId: string) => {
        // In a real app, you'd navigate to a specific chat page, e.g., /chats/{matchId}
        router.push('/chats'); 
    };

    return (
        <AppShell>
            <div className="container mx-auto max-w-4xl p-4">
                <h1 className="text-3xl font-bold mb-6">My Matches</h1>
                {loading && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {[...Array(8)].map((_, i) => (
                            <div key={i} className="flex flex-col items-center gap-2">
                                <Skeleton className="h-24 w-24 rounded-full" />
                                <Skeleton className="h-4 w-20" />
                            </div>
                        ))}
                    </div>
                )}
                {!loading && error && (
                    <div className="text-center text-muted-foreground py-10">
                        <p>{error}</p>
                    </div>
                )}
                {!loading && !error && matches.length === 0 && (
                    <div className="text-center text-muted-foreground py-10">
                        <HeartCrack className="mx-auto h-12 w-12 mb-4" />
                        <h2 className="text-xl font-semibold">No Matches Yet</h2>
                        <p>Keep swiping to find your perfect match!</p>
                    </div>
                )}
                {!loading && !error && matches.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {matches.map((match) => (
                            <Card 
                                key={match.id} 
                                className="text-center p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                                onClick={() => navigateToChat(match.id)}
                            >
                                <CardContent className="flex flex-col items-center gap-2 p-0">
                                    <Avatar className="w-24 h-24 border-2 border-primary">
                                        <AvatarImage src={match.matchedUser.photos?.[0] || ''} alt={match.matchedUser.name} />
                                        <AvatarFallback className="text-3xl">
                                            {getInitials(match.matchedUser.name || '')}
                                        </AvatarFallback>
                                    </Avatar>
                                    <p className="font-semibold truncate w-full">{match.matchedUser.name}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </AppShell>
    );
}
