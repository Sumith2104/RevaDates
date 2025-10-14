
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
            className="flex items-center gap-4 p-3 rounded-2xl hover:bg-white/10 cursor-pointer transition-all duration-300 hover:scale-[1.02] border border-transparent hover:border-white/10"
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
                        <Badge className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-xs px-2 py-1 rounded-full flex items-center justify-center min-w-[1.25rem] h-[1.25rem] shadow-lg shadow-purple-500/50 animate-pulse">
                          {chat.unreadCount > 4 ? '4+' : chat.unreadCount}
                        </Badge>
                    )}
                </div>
            </div>
        </div>
    );
}
