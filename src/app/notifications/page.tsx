
'use client';

import * as React from 'react';
import { AppShell } from '@/components/shared/app-shell';
import { getNotifications, markNotificationsAsRead, respondToLike } from '@/lib/actions';
import { Skeleton } from '@/components/ui/skeleton';
import { Bell, Heart, X, MessageSquare } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils';
import { motion, useInView } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import type { Notification } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useCurrentUser } from '@/hooks/use-current-user';

const timeZone = 'Asia/Kolkata';

const AnimatedNotificationItem = ({ children }: { children: React.ReactNode }) => {
    const ref = React.useRef(null);
    const inView = useInView(ref, { once: false, amount: 0.5 });

    const variants = {
        hidden: { opacity: 0, scale: 0.8 },
        visible: { opacity: 1, scale: 1 },
    };

    return (
        <motion.div
            ref={ref}
            initial="hidden"
            animate={inView ? "visible" : "hidden"}
            variants={variants}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            layout
        >
            {children}
        </motion.div>
    );
};

export default function NotificationsPage() {
    const { user: currentUserId, loading: userLoading } = useCurrentUser();
    const [notifications, setNotifications] = React.useState<Notification[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    const [matchedNotifications, setMatchedNotifications] = React.useState<Record<string, string>>({}); // { notificationId: matchId }
    const { toast } = useToast();
    const router = useRouter();

    React.useEffect(() => {
        async function fetchData(initialLoad = false) {
            // This check ensures we never call actions with a null userId.
            if (!currentUserId) {
                if (initialLoad) setLoading(false);
                return;
            }
            if (initialLoad) setLoading(true);

            const result = await getNotifications(currentUserId);
            
            if (result.error) {
                setError(result.error);
            } else {
                setNotifications(prev => {
                    const newNotifications = result.data as Notification[];
                    // A simple check to see if notifications have actually changed to avoid needless re-renders
                    if (JSON.stringify(prev) !== JSON.stringify(newNotifications)) {
                        return newNotifications;
                    }
                    return prev;
                });
                
                // Mark as read, but don't wait for it to avoid blocking UI updates
                markNotificationsAsRead(currentUserId);
            }

            if (initialLoad) setLoading(false);
        }

        fetchData(true); // Initial fetch

        const interval = setInterval(() => fetchData(false), 3000); // Poll every 3 seconds

        return () => clearInterval(interval); // Cleanup
    }, [currentUserId]);


    const handleResponse = async (notificationId: string, senderId: string, action: 'liked' | 'rejected') => {
        if (!currentUserId) return;

        const result = await respondToLike(notificationId, currentUserId, senderId, action);
        
        if (result.error) {
            toast({ variant: 'destructive', title: 'Response Failed', description: result.error });
        } else if (result.match && result.matchId) {
            setMatchedNotifications(prev => ({ ...prev, [notificationId]: result.matchId as string }));
            toast({
                title: "It's a Match! 🎉",
                description: `You can now start chatting.`,
            });
        } else {
            // It was a rejection or not a match, just remove it from the view instantly
            setNotifications(prev => prev.filter(n => n.id !== notificationId));
        }
    };


    return (
        <AppShell>
            <div className="relative flex-1 overflow-y-auto">
                 {/* Top fade */}
                <div className="sticky top-0 left-0 right-0 h-10 bg-gradient-to-b from-black to-transparent pointer-events-none z-10" />
                <div className="container mx-auto max-w-2xl p-4">
                    <h1 className="text-3xl font-bold mb-6">Notifications</h1>
                    {(loading || userLoading) && (
                        <div className="space-y-4">
                            {[...Array(2)].map((_, i) => (
                                <div key={i} className="flex items-center space-x-4">
                                    <Skeleton className="h-12 w-12 rounded-full" />
                                    <div className="space-y-2">
                                        <Skeleton className="h-4 w-[250px]" />
                                        <Skeleton className="h-4 w-[200px]" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    {!(loading || userLoading) && error && (
                        <div className="text-center text-muted-foreground py-10">
                            <p>{error}</p>
                        </div>
                    )}
                    {!(loading || userLoading) && !error && notifications.length === 0 && (
                        <div className="text-center text-muted-foreground py-10">
                            <Bell className="mx-auto h-12 w-12 mb-4" />
                            <h2 className="text-xl font-semibold">No new notifications</h2>
                            <p>Likes, matches, and messages will appear here.</p>
                        </div>
                    )}
                    {!(loading || userLoading) && !error && notifications.length > 0 && (
                        <div className="space-y-4">
                            {notifications.map((notif) => (
                            <AnimatedNotificationItem key={notif.id}>
                                <div className="flex items-center gap-4 p-4 rounded-lg bg-muted">
                                    <div className="relative">
                                        <Avatar className="h-16 w-16 border-2 border-primary">
                                            {notif.sender?.photos?.[0] && (
                                                <AvatarImage src={notif.sender.photos[0]} alt={notif.sender.name || 'User avatar'} width={64} height={64} />
                                            )}
                                            <AvatarFallback>{getInitials(notif.sender?.name || '')}</AvatarFallback>
                                        </Avatar>
                                        <div className="absolute -bottom-1 -right-1 bg-pink-500 rounded-full p-1 border-2 border-background">
                                            <Heart className="h-3 w-3 text-white fill-white" />
                                        </div>
                                    </div>
                                    <div className="flex-grow">
                                        <p className="text-sm font-semibold">{notif.message}</p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {formatDistanceToNow(toZonedTime(new Date(notif.created_at), timeZone), { addSuffix: true })}
                                        </p>
                                        {notif.type === 'new_like' && (
                                            <div className="flex items-center gap-2 mt-3">
                                                {matchedNotifications[notif.id] ? (
                                                    <Button size="sm" className="rounded-full h-8 px-4 bg-primary hover:bg-primary/90" onClick={() => router.push(`/chats/${matchedNotifications[notif.id]}`)}>
                                                        <MessageSquare className="h-4 w-4 mr-2" /> Go to Chat
                                                    </Button>
                                                ) : (
                                                    <>
                                                        <Button size="sm" className="rounded-full h-8 px-4 bg-green-500 hover:bg-green-600 text-white" onClick={() => handleResponse(notif.id, notif.sender_id, 'liked')}>
                                                            <Heart className="h-4 w-4 mr-1"/> Date
                                                        </Button>
                                                        <Button size="sm" variant="ghost" className="rounded-full h-8 px-4" onClick={() => handleResponse(notif.id, notif.sender_id, 'rejected')}>
                                                           <X className="h-4 w-4 mr-1"/> Reject
                                                        </Button>
                                                    </>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </AnimatedNotificationItem>
                            ))}
                        </div>
                    )}
                </div>
                 {/* Bottom fade */}
                <div className="sticky bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-black to-transparent pointer-events-none z-10" />
            </div>
        </AppShell>
    );
}
