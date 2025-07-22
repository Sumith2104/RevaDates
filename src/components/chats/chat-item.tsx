
'use client';

import * as React from 'react';
import type { Chat } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { getInitials, cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

const timeZone = 'Asia/Kolkata';

export function ChatItem({ chat }: { chat: Chat }) {
    const router = useRouter();

    const navigateToChat = (chatId: string) => {
        router.push(`/chats/${chatId}`);
    };

    const lastMessageTime = chat.lastMessageTime
        ? formatDistanceToNow(toZonedTime(new Date(chat.lastMessageTime), timeZone), { addSuffix: true })
        : '';

    return (
        <div
            className="flex items-center gap-4 p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
            onClick={() => navigateToChat(chat.id)}
        >
            <Avatar className="h-12 w-12">
                {chat.matchedUser.photos?.[0] && (
                    <AvatarImage src={chat.matchedUser.photos[0]} className="object-cover" />
                )}
                <AvatarFallback>{getInitials(chat.matchedUser.name)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 overflow-hidden">
                <div className="flex justify-between items-center">
                    <p className="font-semibold truncate">{chat.matchedUser.name}</p>
                    <p className="text-xs text-muted-foreground whitespace-nowrap">{lastMessageTime}</p>
                </div>
                <div className="flex items-center justify-between gap-2">
                    <p className={cn("text-sm text-muted-foreground truncate", chat.unreadCount > 0 && "font-bold text-foreground")}>
                        {chat.lastMessage}
                    </p>
                    {chat.unreadCount > 0 && (
                        <Badge variant="secondary" className="bg-white text-black">
                            New message
                        </Badge>
                    )}
                </div>
            </div>
        </div>
    );
}
