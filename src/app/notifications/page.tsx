
'use client';

import * as React from 'react';
import { AppShell } from '@/components/shared/app-shell';
import { getNotifications, markNotificationsAsRead } from '@/lib/actions';
import { Skeleton } from '@/components/ui/skeleton';
import { Bell, Heart } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

type Notification = {
    id: string;
    message: string;
    created_at: string;
    is_read: boolean;
    sender: {
        name: string;
        photos: string[] | null;
    } | null;
}

export default function NotificationsPage() {
    const [notifications, setNotifications] = React.useState<Notification[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);

    React.useEffect(() => {
        const userId = localStorage.getItem('currentUserId');
        if (!userId) {
            setError('You must be logged in to see notifications.');
            setLoading(false);
            return;
        }

        const fetchAndMarkNotifications = async () => {
            setLoading(true);
            const result = await getNotifications(userId);
            if (result.error) {
                setError(result.error);
            } else {
                setNotifications(result.data as Notification[]);
                // Mark as read after fetching
                await markNotificationsAsRead(userId);
            }
            setLoading(false);
        };

        fetchAndMarkNotifications();
    }, []);

    return (
        <AppShell>
            <div className="container mx-auto max-w-2xl p-4">
                <h1 className="text-3xl font-bold mb-6">Notifications</h1>
                {loading && (
                    <div className="space-y-4">
                        <div className="flex items-center space-x-4">
                            <Skeleton className="h-12 w-12 rounded-full" />
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-[250px]" />
                                <Skeleton className="h-4 w-[200px]" />
                            </div>
                        </div>
                        <div className="flex items-center space-x-4">
                            <Skeleton className="h-12 w-12 rounded-full" />
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-[250px]" />
                                <Skeleton className="h-4 w-[200px]" />
                            </div>
                        </div>
                    </div>
                )}
                {!loading && error && (
                    <div className="text-center text-muted-foreground py-10">
                        <p>{error}</p>
                    </div>
                )}
                {!loading && !error && notifications.length === 0 && (
                    <div className="text-center text-muted-foreground py-10">
                         <Bell className="mx-auto h-12 w-12 mb-4" />
                        <h2 className="text-xl font-semibold">No new notifications</h2>
                        <p>Likes, matches, and messages will appear here.</p>
                    </div>
                )}
                 {!loading && !error && notifications.length > 0 && (
                     <div className="space-y-4">
                        {notifications.map((notif) => (
                           <div key={notif.id} className={`flex items-start gap-4 p-4 rounded-lg bg-muted`}>
                                <div className="relative">
                                    <Avatar className="h-10 w-10">
                                        <AvatarImage src={notif.sender?.photos?.[0] || ''} alt={notif.sender?.name} />
                                        <AvatarFallback>{getInitials(notif.sender?.name || '')}</AvatarFallback>
                                    </Avatar>
                                     <div className="absolute -bottom-1 -right-1 bg-pink-500 rounded-full p-1 border-2 border-background">
                                        <Heart className="h-3 w-3 text-white fill-white" />
                                    </div>
                                </div>
                                <div className="flex-grow">
                                    <p className="text-sm font-semibold">{notif.message}</p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                                    </p>
                                </div>
                           </div>
                        ))}
                     </div>
                 )}
            </div>
        </AppShell>
    );
}
