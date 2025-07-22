
'use client';

import * as React from 'react';
import type { Match } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils';

export function MatchItem({ match }: { match: Match }) {
    const router = useRouter();

    const navigateToChat = (matchId: string) => {
        router.push(`/chats/${matchId}`);
    };

    return (
        <div className="flex flex-col items-center gap-2 flex-shrink-0 cursor-pointer" onClick={() => navigateToChat(match.id)}>
            <Avatar className="h-16 w-16 border-2 border-primary">
                {match.matchedUser.photos?.[0] && (
                    <AvatarImage src={match.matchedUser.photos[0]} className="object-cover" />
                )}
                <AvatarFallback>{getInitials(match.matchedUser.name)}</AvatarFallback>
            </Avatar>
            <p className="text-sm font-medium truncate w-16 text-center">{match.matchedUser.name.split(' ')[0]}</p>
        </div>
    );
}
