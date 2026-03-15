
'use client';

import * as React from 'react';
import { AppShell } from '@/components/shared/app-shell';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getInitials, cn } from '@/lib/utils';
import { getMatchDetails, getChatMessages, sendMessage, markMessagesAsRead, blockUser } from '@/lib/actions';
import type { UserProfile, Message } from '@/lib/types';
import { ArrowLeft, Send, Check, CheckCheck, MoreVertical, User, ShieldAlert, Loader2 } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { format as formatTZ, toZonedTime } from 'date-fns-tz';
import { isToday, isYesterday, format } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from '@/hooks/use-toast';
import { useCurrentUser } from '@/hooks/use-current-user';
import { PageLoader } from '@/components/shared/page-loader';
import { useUpdates } from '@/context/updates-context';

const timeZone = 'Asia/Kolkata';

const formatDateSeparator = (dateStr: string) => {
    const zonedDate = toZonedTime(new Date(dateStr), timeZone);
    if (isToday(zonedDate)) return 'Today';
    if (isYesterday(zonedDate)) return 'Yesterday';
    return format(zonedDate, 'MMMM d, yyyy');
};

export default function ChatPage() {
    const router = useRouter();
    const params = useParams();
    const { toast } = useToast();
    const { user: currentUserId, loading: userLoading } = useCurrentUser();
    const { subscribe } = useUpdates();
    const chatId = params.chatId as string;
    
    // ... existing state ...
    const [matchedUser, setMatchedUser] = React.useState<UserProfile | null>(null);
    const [messages, setMessages] = React.useState<Message[]>([]);
    const [newMessage, setNewMessage] = React.useState('');
    const [loadingMessages, setLoadingMessages] = React.useState(true);
    const [isBlockConfirmOpen, setIsBlockConfirmOpen] = React.useState(false);
    const messagesEndRef = React.useRef<HTMLDivElement>(null);

    // ... existing effects and helpers ...

    const fetchMessages = React.useCallback(async () => {
        const messagesData = await getChatMessages(chatId);
        if (!messagesData.error && messagesData.data) {
            const newMessages = messagesData.data as Message[];
            
            // Only update state if there are actual new messages or status changes
            setMessages(prevMessages => {
                const optimisticMessages = prevMessages.filter(m => m.tempId);
                const finalMessages = [...newMessages];
                
                optimisticMessages.forEach(optMsg => {
                    if (!finalMessages.some(sMsg => sMsg.id === optMsg.id || sMsg.tempId === optMsg.tempId)) {
                        finalMessages.push(optMsg);
                    }
                });

                if (JSON.stringify(finalMessages) !== JSON.stringify(prevMessages)) {
                    return finalMessages;
                }
                return prevMessages;
            });

            // Mark as read if any new message is for the current user
            const hasNewUnread = newMessages.some(m => m.recipient_id === currentUserId && !m.is_read);
            if (hasNewUnread) {
                handleMarkAsRead();
            }
        }
    }, [chatId, currentUserId, handleMarkAsRead]);

    React.useEffect(() => {
        if (!chatId || !currentUserId) return;

        // Subscribe to real-time updates for messages
        const unsubscribe = subscribe('messages', (event) => {
            // If the new message belongs to this chat, refresh
            if (event.type === 'row.inserted' && event.new?.match_id === chatId) {
                fetchMessages();
            }
            // If a message was updated (e.g., marked as read), refresh
            if (event.type === 'row.updated' && event.new?.match_id === chatId) {
                fetchMessages();
            }
        });

        return () => unsubscribe();
    }, [chatId, currentUserId, subscribe, fetchMessages]);


    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !currentUserId || !matchedUser) return;
        
        const content = newMessage;
        const tempId = `temp_${Date.now()}`;
        setNewMessage('');
        
        const optimisticMessage: Message = {
            id: tempId,
            tempId: tempId,
            match_id: chatId,
            sender_id: currentUserId,
            recipient_id: matchedUser.id,
            content: content,
            created_at: new Date().toISOString(),
            is_read: false,
        };

        setMessages(prev => [...prev, optimisticMessage]);

        const result = await sendMessage(chatId, currentUserId, matchedUser.id, content, tempId);
        
        if (result.error || !result.data) {
             setNewMessage(content);
             setMessages(prev => prev.filter(m => m.id !== tempId));
        } else {
            
            setMessages(prev => prev.map(m => m.id === tempId ? result.data as Message : m));
        }
    };
    
    const handleBlock = async () => {
        if (!currentUserId || !matchedUser) return;
        const result = await blockUser(currentUserId, matchedUser.id);
        if (result.error) {
            toast({
                variant: 'destructive',
                title: 'Could Not Block User',
                description: result.error,
            });
        } else {
            toast({
                title: 'User Blocked',
                description: `You will no longer see ${matchedUser.name}'s profile or chats.`,
            });
            router.push('/chats');
        }
        setIsBlockConfirmOpen(false);
    }
    
    if (userLoading || !matchedUser) {
        return <PageLoader />;
    }
    
    return (
        <div className="flex flex-col h-screen bg-background">
            
            <header className="flex items-center gap-4 p-2 border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-6 w-6" />
                </Button>
                <div
                    className="flex items-center gap-4 flex-1 cursor-pointer"
                    onClick={() => router.push(`/users/${matchedUser.id}`)}
                >
                    <Avatar>
                        {matchedUser.photos?.[0] && (
                            <AvatarImage src={matchedUser.photos[0]} alt={matchedUser.name} width={40} height={40} className="object-cover" />
                        )}
                        <AvatarFallback>{getInitials(matchedUser.name)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                        <h2 className="font-semibold text-lg">{matchedUser.name}</h2>
                    </div>
                </div>
                 <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <MoreVertical className="h-6 w-6" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => router.push(`/users/${matchedUser.id}`)}>
                            <User className="mr-2 h-4 w-4" />
                            <span>View Profile</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setIsBlockConfirmOpen(true)} className="text-destructive focus:text-destructive">
                            <ShieldAlert className="mr-2 h-4 w-4" />
                            <span>Block User</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </header>
            
            
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {loadingMessages ? (
                     <div className="flex flex-1 items-center justify-center h-full">
                        <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                ) : (
                    <>
                        {messages.map((message, index) => {
                            const isCurrentUser = message.sender_id === currentUserId;
                            const prevMessage = messages[index - 1];
                            const showDateSeparator = !prevMessage || new Date(message.created_at).toDateString() !== new Date(prevMessage.created_at).toDateString();
                            
                            const isFirstInBlock = !prevMessage || prevMessage.sender_id !== message.sender_id;
                            const showAvatar = !isCurrentUser && isFirstInBlock;
                            const isOptimistic = !!message.tempId;

                            return (
                                <React.Fragment key={message.id}>
                                    {showDateSeparator && (
                                        <div className="text-center text-xs text-muted-foreground my-4">
                                            <span className="bg-muted px-2 py-1 rounded-full">{formatDateSeparator(message.created_at)}</span>
                                        </div>
                                    )}
                                    <div className={cn("flex w-full items-end gap-2", isCurrentUser && "justify-end")}>
                                        {showAvatar && (
                                            <Avatar className="h-8 w-8 self-end">
                                                {matchedUser.photos?.[0] && (
                                                    <AvatarImage src={matchedUser.photos[0]} alt={matchedUser.name} width={32} height={32} className="object-cover" />
                                                )}
                                                <AvatarFallback>{getInitials(matchedUser.name)}</AvatarFallback>
                                            </Avatar>
                                        )}
                                        {!showAvatar && !isCurrentUser && (
                                            <div className="w-8" /> 
                                        )}
                                        <div className={cn(
                                            "rounded-2xl px-3 py-2 max-w-[80%] flex items-end gap-2",
                                            isCurrentUser 
                                                ? 'bg-primary text-primary-foreground rounded-br-none' 
                                                : 'bg-muted rounded-bl-none',
                                            isOptimistic && 'opacity-70'
                                        )}>
                                            <p className="text-base break-words whitespace-pre-wrap">{message.content}</p>
                                            <div className="flex items-center gap-1 self-end flex-shrink-0">
                                                <span className={cn(
                                                  "text-xs opacity-70 whitespace-nowrap",
                                                  isCurrentUser ? "text-primary-foreground" : "text-muted-foreground"
                                                )}>
                                                    {formatTZ(new Date(message.created_at), 'h:mm a', { timeZone })}
                                                </span>
                                                {isCurrentUser && !isOptimistic && (
                                                    message.is_read 
                                                        ? <CheckCheck className="h-4 w-4 text-blue-500" />
                                                        : <Check className="h-4 w-4" />
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </React.Fragment>
                            );
                        })}
                         <div ref={messagesEndRef} />
                    </>
                )}
            </div>

            
            <footer className="p-4 border-t bg-card/50 backdrop-blur-sm sticky bottom-0 z-10">
                <form className="flex items-center gap-2" onSubmit={handleSendMessage}>
                    <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 border-2"
                        autoComplete="off"
                        disabled={loadingMessages && messages.length === 0}
                    />
                    <Button type="submit" size="icon" disabled={!newMessage.trim() || (loadingMessages && messages.length === 0)}>
                        <Send className="h-5 w-5" />
                    </Button>
                </form>
            </footer>
            
            <AlertDialog open={isBlockConfirmOpen} onOpenChange={setIsBlockConfirmOpen}>
                <AlertDialogContent className="w-full max-w-[330px] rounded-lg p-6 text-center shadow-2xl bg-white/10 backdrop-blur-lg">
                    <AlertDialogHeader className="text-center sm:text-center">
                        <AlertDialogTitle className="text-white text-lg font-semibold">Block {matchedUser.name}?</AlertDialogTitle>
                        <AlertDialogDescription className="text-sm text-white/70 mt-2">
                            Are you sure? You won't see their profile again and this cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-6 flex flex-row sm:justify-center justify-center gap-4">
                        <AlertDialogAction onClick={handleBlock} className="w-28 bg-red-700 hover:bg-red-800 text-white px-6 py-2 rounded-full shadow-md">Block</AlertDialogAction>
                        <AlertDialogCancel onClick={() => setIsBlockConfirmOpen(false)} className="w-28 bg-white hover:bg-gray-100 hover:text-black text-black px-6 py-2 rounded-full shadow-md mt-0">Cancel</AlertDialogCancel>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
