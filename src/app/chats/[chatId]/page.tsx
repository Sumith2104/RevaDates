
'use client';

import * as React from 'react';
import { AppShell } from '@/components/shared/app-shell';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { getInitials, cn } from '@/lib/utils';
import { getMatchDetails, getChatMessages, sendMessage, markMessagesAsRead, blockUser } from '@/lib/actions';
import type { UserProfile, Message } from '@/lib/types';
import { ArrowLeft, Send, Check, CheckCheck, MoreVertical, User, ShieldAlert } from 'lucide-react';
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
    const chatId = params.chatId as string;
    const [currentUserId, setCurrentUserId] = React.useState<string | null>(null);
    const [matchedUser, setMatchedUser] = React.useState<UserProfile | null>(null);
    const [messages, setMessages] = React.useState<Message[]>([]);
    const [newMessage, setNewMessage] = React.useState('');
    const [loading, setLoading] = React.useState(true);
    const [isBlockConfirmOpen, setIsBlockConfirmOpen] = React.useState(false);
    const messagesEndRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        const userId = localStorage.getItem('currentUserId');
        if (!userId) {
            router.push('/login');
        } else {
            setCurrentUserId(userId);
        }
    }, [router]);
    
    const scrollToBottom = React.useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, []);

    React.useEffect(() => {
      scrollToBottom();
    }, [messages, scrollToBottom]);

    const handleMarkAsRead = React.useCallback(async () => {
        if (!chatId || !currentUserId) return;
        await markMessagesAsRead(chatId, currentUserId);
    }, [chatId, currentUserId]);

    React.useEffect(() => {
        if (!currentUserId || !chatId) return;

        async function fetchInitialData() {
            setLoading(true);
            const [matchDetails, messagesData] = await Promise.all([
                getMatchDetails(chatId, currentUserId!),
                getChatMessages(chatId)
            ]);

            if (matchDetails.error || !matchDetails.data) {
                router.push('/chats');
                return;
            }
            setMatchedUser(matchDetails.data as UserProfile);

            if (messagesData.error || !messagesData.data) {
                // Handle error
            } else {
                setMessages(messagesData.data as Message[]);
                handleMarkAsRead();
            }
            setLoading(false);
        }
        fetchInitialData();
    }, [chatId, currentUserId, router, handleMarkAsRead]);
    
    // Polling for new messages
    React.useEffect(() => {
        if (!chatId || !currentUserId) return;

        const interval = setInterval(async () => {
            const messagesData = await getChatMessages(chatId);
            if (!messagesData.error && messagesData.data) {
                const newMessages = messagesData.data as Message[];
                const hasNewUnread = newMessages.some(m => m.recipient_id === currentUserId && !m.is_read);
                if (hasNewUnread) {
                    handleMarkAsRead();
                }

                setMessages(prevMessages => {
                    const optimisticMessages = prevMessages.filter(m => m.tempId);
                    
                    const finalMessages = [...newMessages];
                    
                    optimisticMessages.forEach(optMsg => {
                        if (!finalMessages.some(sMsg => sMsg.id === optMsg.id || sMsg.tempId === optMsg.tempId)) {
                            finalMessages.push(optMsg);
                        }
                    });

                    if (finalMessages.length !== prevMessages.length || JSON.stringify(finalMessages) !== JSON.stringify(prevMessages)) {
                         return finalMessages;
                    }
                    return prevMessages;
                });
            }
        }, 1000); // Poll every 1 second

        return () => clearInterval(interval);
    }, [chatId, currentUserId, handleMarkAsRead]);


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
            // Replace optimistic with real message from server response
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
                    {matchedUser.photos?.[0] && (
                        <AvatarImage src={matchedUser.photos[0]} className="object-cover" />
                    )}
                    <AvatarFallback>{getInitials(matchedUser.name)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                    <h2 className="font-semibold text-lg">{matchedUser.name}</h2>
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
            
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
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
                                            <AvatarImage src={matchedUser.photos[0]} className="object-cover" />
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
                    />
                    <Button type="submit" size="icon" disabled={!newMessage.trim()}>
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
