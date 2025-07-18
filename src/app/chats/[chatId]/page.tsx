
'use client';

import * as React from 'react';
import { AppShell } from '@/components/shared/app-shell';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { getInitials, cn } from '@/lib/utils';
import { getMatchDetails, getChatMessages, sendMessage } from '@/lib/actions';
import type { UserProfile } from '@/lib/types';
import { ArrowLeft, Send } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { format, isToday, isYesterday, formatDistanceToNowStrict } from 'date-fns';

type Message = {
    id: string;
    content: string;
    sender_id: string;
    created_at: string;
};

const formatDateSeparator = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'MMMM d, yyyy');
};


export default function ChatPage() {
    const router = useRouter();
    const params = useParams();
    const chatId = params.chatId as string;
    const [currentUserId, setCurrentUserId] = React.useState<string | null>(null);
    const [matchedUser, setMatchedUser] = React.useState<UserProfile | null>(null);
    const [messages, setMessages] = React.useState<Message[]>([]);
    const [newMessage, setNewMessage] = React.useState('');
    const [loading, setLoading] = React.useState(true);
    const [sending, setSending] = React.useState(false);
    const messagesEndRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        const userId = localStorage.getItem('currentUserId');
        if (!userId) {
            router.push('/login');
        } else {
            setCurrentUserId(userId);
        }
    }, [router]);
    
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    React.useEffect(() => {
      scrollToBottom();
    }, [messages]);

    React.useEffect(() => {
        if (!currentUserId || !chatId) return;

        async function fetchData() {
            setLoading(true);
            const [matchDetails, messagesData] = await Promise.all([
                getMatchDetails(chatId, currentUserId!),
                getChatMessages(chatId)
            ]);

            if (matchDetails.error || !matchDetails.data) {
                console.error(matchDetails.error);
                router.push('/chats');
                return;
            }
            setMatchedUser(matchDetails.data as UserProfile);

            if (messagesData.error || !messagesData.data) {
                console.error(messagesData.error);
            } else {
                setMessages(messagesData.data as Message[]);
            }
            setLoading(false);
        }
        fetchData();
    }, [chatId, currentUserId, router]);

    React.useEffect(() => {
        if (!chatId) return;
        const supabase = createClient();
        const channel = supabase
            .channel(`realtime-chat-${chatId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `match_id=eq.${chatId}`
                },
                (payload) => {
                    const receivedMessage = payload.new as Message;
                    
                    setMessages(prevMessages => {
                        if (prevMessages.some(m => m.id === receivedMessage.id)) {
                            return prevMessages; // Avoid duplicates
                        }
                        return [...prevMessages, receivedMessage];
                    });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [chatId]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !currentUserId || !matchedUser) return;
        setSending(true);

        const content = newMessage;
        setNewMessage('');

        const result = await sendMessage(chatId, currentUserId, matchedUser.id, content);
        
        if (result.error || !result.data) {
             setNewMessage(content);
        }

        setSending(false);
        scrollToBottom();
    };

    if (loading) {
        return (
            <div className="flex flex-col h-screen">
                <header className="flex items-center gap-4 p-4 border-b">
                    <Skeleton className="h-6 w-6" />
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <Skeleton className="h-6 w-32" />
                </header>
                <div className="flex-1 p-4 space-y-4">
                    <Skeleton className="h-10 w-3/4" />
                    <Skeleton className="h-10 w-3/4 ml-auto" />
                    <Skeleton className="h-10 w-1/2" />
                </div>
            </div>
        );
    }
    
    if (!matchedUser) {
        return (
             <div className="flex flex-col h-screen items-center justify-center">
                <p>Could not load chat.</p>
             </div>
        )
    }

    return (
        <div className="flex flex-col h-screen bg-background">
            {/* Header */}
            <header className="flex items-center gap-4 p-2 border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-6 w-6" />
                </Button>
                <Avatar>
                    <AvatarImage src={matchedUser.photos?.[0]} className="object-cover" />
                    <AvatarFallback>{getInitials(matchedUser.name)}</AvatarFallback>
                </Avatar>
                <h2 className="font-semibold text-lg">{matchedUser.name}</h2>
            </header>
            
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {messages.map((message, index) => {
                    const isCurrentUser = message.sender_id === currentUserId;
                    const prevMessage = messages[index - 1];
                    const showDateSeparator = !prevMessage || new Date(message.created_at).toDateString() !== new Date(prevMessage.created_at).toDateString();
                    
                    const isFirstInBlock = !prevMessage || prevMessage.sender_id !== message.sender_id;
                    const showAvatar = !isCurrentUser && isFirstInBlock;

                    return (
                        <React.Fragment key={message.id}>
                            {showDateSeparator && (
                                <div className="text-center text-xs text-muted-foreground my-4">
                                    <span className="bg-muted px-2 py-1 rounded-full">{formatDateSeparator(message.created_at)}</span>
                                </div>
                            )}
                            <div className={cn("flex w-full items-end gap-2 group", isCurrentUser && "justify-end")}>
                                {showAvatar && (
                                    <Avatar className="h-8 w-8 self-end">
                                        <AvatarImage src={matchedUser.photos?.[0]} className="object-cover" />
                                        <AvatarFallback>{getInitials(matchedUser.name)}</AvatarFallback>
                                    </Avatar>
                                )}
                                {!showAvatar && !isCurrentUser && (
                                    <div className="w-8" /> 
                                )}
                                <div className={cn("flex items-end gap-2 max-w-[80%]", isCurrentUser && "flex-row-reverse")}>
                                    <div className={cn(
                                        "rounded-2xl px-4 py-2",
                                        isCurrentUser 
                                            ? 'bg-primary text-primary-foreground rounded-br-none' 
                                            : 'bg-muted rounded-bl-none'
                                    )}>
                                        <p className="text-base break-words">{message.content}</p>
                                    </div>
                                    <span className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity duration-300 self-end whitespace-nowrap">
                                        {format(new Date(message.created_at), 'h:mm a')}
                                    </span>
                                </div>
                            </div>
                        </React.Fragment>
                    );
                })}
                 <div ref={messagesEndRef} />
            </div>

            {/* Input Form */}
            <footer className="p-4 border-t bg-card/50 backdrop-blur-sm sticky bottom-0 z-10">
                <form className="flex items-center gap-2" onSubmit={handleSendMessage}>
                    <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 border-2"
                        autoComplete="off"
                        disabled={sending}
                    />
                    <Button type="submit" size="icon" disabled={!newMessage.trim() || sending}>
                        <Send className="h-5 w-5" />
                    </Button>
                </form>
            </footer>
        </div>
    );
}

