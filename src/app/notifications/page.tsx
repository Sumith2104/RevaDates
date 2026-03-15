
'use client';

import * as React from 'react';
import { AppShell } from '@/components/shared/app-shell';
import { getNotifications, markNotificationsAsRead, respondToLike } from '@/lib/actions';
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
import { PageLoader } from '@/components/shared/page-loader';

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
    const [matchedNotifications, setMatchedNotifications] = React.useState<Record<string, string>>({}); 
    const { toast } = useToast();
    const router = useRouter();

    React.useEffect(() => {
        if (!currentUserId) return;

        // ── Initial load ──────────────────────────────────────────────
        async function initialLoad() {
            setLoading(true);
            const result = await getNotifications(currentUserId!);
            if (result.error) {
                setError(result.error);
            } else {
                setNotifications(result.data as Notification[]);
                // Mark all as read once on page open
                await markNotificationsAsRead(currentUserId!);
            }
            setLoading(false);
        }

        // ── Re-fetch without marking read (called on webhook push) ────
        async function refreshNotifications() {
            const result = await getNotifications(currentUserId!);
            if (!result.error) {
                setNotifications(prev => {
                    const next = result.data as Notification[];
                    return JSON.stringify(prev) !== JSON.stringify(next) ? next : prev;
                });
            }
        }

        initialLoad();

        // ── SSE subscription (Fluxbase webhook → /api/updates) ────────
        const es = new EventSource('/api/updates');

        es.onmessage = (event) => {
            try {
                const payload = JSON.parse(event.data);
                const table = payload.table as string | undefined;
                // Only re-fetch when the notifications table changes
                if (table === 'notifications') {
                    refreshNotifications();
                }
            } catch { /* ignore parse errors */ }
        };

        es.onerror = () => {
            // EventSource auto-reconnects on error — nothing to do here
            console.warn('[SSE] Connection lost, will auto-reconnect...');
        };

        return () => es.close();
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
            
            setNotifications(prev => prev.filter(n => n.id !== notificationId));
        }
    };

    if (loading || userLoading) {
        return <PageLoader />;
    }

    return (
        <AppShell>
            <div className="relative flex-1 overflow-y-auto">
                 
                <div className="sticky top-0 left-0 right-0 h-10 bg-gradient-to-b from-black to-transparent pointer-events-none z-10" />
                <div className="container mx-auto max-w-2xl p-4">
                    <h1 className="text-3xl font-bold mb-6 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Notifications</h1>
                    {error && (
                        <div className="text-center text-muted-foreground py-10">
                            <p>{error}</p>
                        </div>
                    )}
                    {!error && notifications.length === 0 && (
                        <div className="text-center text-white/60 py-12 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl">
                            <Bell className="mx-auto h-14 w-14 mb-4 text-purple-400" />
                            <h2 className="text-xl font-semibold text-white">No new notifications</h2>
                            <p>Likes, matches, and messages will appear here.</p>
                        </div>
                    )}
                    {!error && notifications.length > 0 && (
                        <div className="space-y-4">
                            {notifications.map((notif) => (
                            <AnimatedNotificationItem key={notif.id}>
                                <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-300">
                                    <div className="relative">
                                        <div className="p-1 rounded-full bg-gradient-to-br from-purple-500 to-pink-500">
                                            <Avatar className="h-16 w-16 ring-2 ring-black">
                                                {notif.sender?.photos?.[0] && (
                                                    <AvatarImage src={notif.sender.photos[0]} alt={notif.sender.name || 'User avatar'} width={64} height={64} />
                                                )}
                                                <AvatarFallback>{getInitials(notif.sender?.name || '')}</AvatarFallback>
                                            </Avatar>
                                        </div>
                                        <div className="absolute -bottom-1 -right-1 bg-gradient-to-br from-pink-500 to-red-500 rounded-full p-1.5 border-2 border-black shadow-lg">
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
                                                    <Button size="sm" className="rounded-full h-9 px-5 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border-none" onClick={() => router.push(`/chats/${matchedNotifications[notif.id]}`)}>
                                                        <MessageSquare className="h-4 w-4 mr-2" /> Go to Chat
                                                    </Button>
                                                ) : (
                                                    <>
                                                        <Button size="sm" className="rounded-full h-9 px-5 bg-gradient-to-r from-green-400 to-emerald-500 hover:from-green-500 hover:to-emerald-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border-none" onClick={() => handleResponse(notif.id, notif.sender_id, 'liked')}>
                                                            <Heart className="h-4 w-4 mr-1 fill-white"/> Date
                                                        </Button>
                                                        <Button size="sm" className="rounded-full h-9 px-5 bg-white/10 hover:bg-white/20 border border-white/20 transition-all duration-300 hover:scale-105" onClick={() => handleResponse(notif.id, notif.sender_id, 'rejected')}>
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
                 
                <div className="sticky bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-black to-transparent pointer-events-none z-10" />
            </div>
        </AppShell>
    );
}

    

    