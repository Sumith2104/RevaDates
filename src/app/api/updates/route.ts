import { NextRequest } from 'next/server';
import { webhookEventEmitter } from '@/lib/events';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    const stream = new ReadableStream({
        start(controller) {
            const listener = (event: any) => {
                const data = `data: ${event.data}\n\n`;
                controller.enqueue(new TextEncoder().encode(data));
            };

            webhookEventEmitter.addEventListener('update', listener);

            // Keep the connection alive with a heartbeat
            const heartbeat = setInterval(() => {
                controller.enqueue(new TextEncoder().encode(': heartbeat\n\n'));
            }, 30000);

            // Clean up when the connection is closed
            req.signal.addEventListener('abort', () => {
                webhookEventEmitter.removeEventListener('update', listener);
                clearInterval(heartbeat);
                controller.close();
            });
        }
    });

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache, no-transform',
            'Connection': 'keep-alive',
        },
    });
}
