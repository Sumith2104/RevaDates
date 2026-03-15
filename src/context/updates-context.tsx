// src/context/updates-context.tsx
'use client';

import React, { createContext, useContext, useEffect, useRef, useCallback } from 'react';

type UpdateEvent = {
    type: string;
    table: string;
    new?: any;
    old?: any;
};

type UpdatesContextType = {
    subscribe: (table: string, callback: (event: UpdateEvent) => void) => () => void;
};

const UpdatesContext = createContext<UpdatesContextType | undefined>(undefined);

export function UpdatesProvider({ children }: { children: React.ReactNode }) {
    // Use a ref so the SSE effect never needs to re-run when subscriptions change
    const listenersRef = useRef<Map<string, Set<(event: UpdateEvent) => void>>>(new Map());

    const subscribe = useCallback((table: string, callback: (event: UpdateEvent) => void) => {
        if (!listenersRef.current.has(table)) {
            listenersRef.current.set(table, new Set());
        }
        listenersRef.current.get(table)!.add(callback);

        return () => {
            listenersRef.current.get(table)?.delete(callback);
        };
    }, []);

    useEffect(() => {
        let eventSource: EventSource | null = null;
        let retryCount = 0;
        const maxRetries = 5;
        let retryTimeout: ReturnType<typeof setTimeout> | null = null;

        const connect = () => {
            console.log('[UpdatesContext] Connecting to SSE...');
            eventSource = new EventSource('/api/updates');

            eventSource.onopen = () => {
                console.log('[UpdatesContext] SSE connection established.');
                retryCount = 0;
            };

            eventSource.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    const normalizedEvent: UpdateEvent = {
                        type: data.type || data.event_type,
                        table: data.table || data.table_id,
                        new: data.new || data.data?.new,
                        old: data.old || data.data?.old
                    };

                    const tableListeners = listenersRef.current.get(normalizedEvent.table);
                    if (tableListeners) {
                        tableListeners.forEach(cb => cb(normalizedEvent));
                    }
                } catch {
                    // Ignore non-JSON messages (heartbeats etc.)
                }
            };

            eventSource.onerror = () => {
                console.error('[UpdatesContext] SSE connection error, will retry...');
                eventSource?.close();

                if (retryCount < maxRetries) {
                    retryCount++;
                    const delay = Math.pow(2, retryCount) * 1000;
                    console.log(`[UpdatesContext] Retrying in ${delay / 1000}s...`);
                    retryTimeout = setTimeout(connect, delay);
                }
            };
        };

        connect();

        return () => {
            if (retryTimeout) clearTimeout(retryTimeout);
            eventSource?.close();
        };
    }, []); // ← empty dep array: connect once and never re-run

    return (
        <UpdatesContext.Provider value={{ subscribe }}>
            {children}
        </UpdatesContext.Provider>
    );
}

export function useUpdates() {
    const context = useContext(UpdatesContext);
    if (context === undefined) {
        throw new Error('useUpdates must be used within an UpdatesProvider');
    }
    return context;
}
