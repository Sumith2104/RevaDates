// src/context/updates-context.tsx
'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

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
    const [listeners, setListeners] = useState<Map<string, Set<(event: UpdateEvent) => void>>>(new Map());

    const subscribe = useCallback((table: string, callback: (event: UpdateEvent) => void) => {
        setListeners(prev => {
            const next = new Map(prev);
            if (!next.has(table)) {
                next.set(table, new Set());
            }
            next.get(table)!.add(callback);
            return next;
        });

        return () => {
            setListeners(prev => {
                const next = new Map(prev);
                if (next.has(table)) {
                    next.get(table)!.delete(callback);
                }
                return next;
            });
        };
    }, []);

    useEffect(() => {
        let eventSource: EventSource | null = null;
        let retryCount = 0;
        const maxRetries = 5;

        const connect = () => {
            console.log('[UpdatesContext] Connecting to SSE...');
            // We use our own bridge to keep Fluxbase API keys secure on the server.
            // Our bridge is updated to support Fluxbase v4.0 payloads.
            eventSource = new EventSource('/api/updates');

            eventSource.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    // Standardize Fluxbase v4.0 payload to our UpdateEvent type
                    const normalizedEvent: UpdateEvent = {
                        type: data.type || data.event_type,
                        table: data.table || data.table_id,
                        new: data.new || data.data?.new,
                        old: data.old || data.data?.old
                    };

                    const tableListeners = listeners.get(normalizedEvent.table);
                    if (tableListeners) {
                        tableListeners.forEach(callback => callback(normalizedEvent));
                    }
                } catch (err) {
                    // Ignore non-JSON messages (like heartbeats)
                }
            };

            eventSource.onerror = (err) => {
                console.error('[UpdatesContext] SSE connection error:', err);
                eventSource?.close();
                
                if (retryCount < maxRetries) {
                    retryCount++;
                    const delay = Math.pow(2, retryCount) * 1000;
                    console.log(`[UpdatesContext] Retrying in ${delay / 1000}s...`);
                    setTimeout(connect, delay);
                }
            };

            eventSource.onopen = () => {
                console.log('[UpdatesContext] SSE connection established.');
                retryCount = 0;
            };
        };

        connect();

        return () => {
            eventSource?.close();
        };
    }, [listeners]);

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
