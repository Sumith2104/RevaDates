
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
        <div className="flex flex-col items-center gap-2 flex-shrink-0 cursor-pointer group" onClick={() => navigateToChat(match.id)}>
            <div className="relative p-1 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 group-hover:shadow-lg group-hover:shadow-purple-500/50 transition-all duration-300">
                <Avatar className="h-16 w-16 ring-2 ring-black">
                    {match.matchedUser.photos?.[0] && (
                        <AvatarImage src={match.matchedUser.photos[0]} alt={match.matchedUser.name} width={64} height={64} className="object-cover" />
                    )}
                    <AvatarFallback>{getInitials(match.matchedUser.name)}</AvatarFallback>
                </Avatar>
            </div>
            <p className="text-sm font-medium truncate w-20 text-center">{match.matchedUser.name.split(' ')[0]}</p>
        </div>
    );
}
