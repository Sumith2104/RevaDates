
'use client';

import * as React from 'react';
import type { Chat } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { getInitials, cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { useInView } from 'framer-motion';

const timeZone = 'Asia/Kolkata';

export function ChatItem({ chat }: { chat: Chat }) {
    const router = useRouter();
    const ref = React.useRef(null);
    const isInView = useInView(ref, { once: true });

    const navigateToChat = (chatId: string) => {
        try {
            sessionStorage.setItem(`chat-user-${chatId}`, JSON.stringify(chat.matchedUser));
        } catch (error) {
            console.warn("Could not save chat user to sessionStorage", error);
        }
        router.push(`/chats/${chatId}`);
    };
    
    React.useEffect(() => {
        if (isInView) {
            router.prefetch(`/chats/${chat.id}`);
        }
    }, [isInView, router, chat.id]);

    const lastMessageTime = chat.lastMessageTime
        ? formatDistanceToNow(toZonedTime(new Date(chat.lastMessageTime), timeZone), { addSuffix: true })
        : '';

    return (
        <div
            ref={ref}
            className="flex items-center gap-4 p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
            onClick={() => navigateToChat(chat.id)}
        >
            <Avatar className="h-12 w-12">
                {chat.matchedUser.photos?.[0] && (
                    <AvatarImage src={chat.matchedUser.photos[0]} alt={chat.matchedUser.name} width={48} height={48} className="object-cover" />
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
                        <Badge className="bg-white text-black text-xs px-2 py-0.5 rounded-full flex items-center justify-center min-w-[1rem] h-[1rem]">
                          {chat.unreadCount > 4 ? '4+' : chat.unreadCount}
                        </Badge>
                    )}
                </div>
            </div>
        </div>
    );
}
