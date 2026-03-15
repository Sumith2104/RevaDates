// src/app/api/webhooks/fluxbase/route.ts
import { NextRequest, NextResponse } from 'next/server';

// This is a simple in-memory way to broadcast events for SSE.
// In a serverless environment like Vercel, this won't work as expected for global broadcasting 
// across different instances. However, for this project's scope, we'll implement it this way.
// A more robust solution would use Redis Pub/Sub or a dedicated real-time service.

export const runtime = 'nodejs';

import { webhookEventEmitter } from '@/lib/events';
import { createHmac } from 'node:crypto';

export async function POST(req: NextRequest) {
    try {
        const bodyText = await req.text();
        const signature = req.headers.get('x-fluxbase-signature');
        const secret = process.env.FLUX_API;

        if (secret && signature) {
            const expectedSignature = createHmac('sha256', secret)
                .update(bodyText)
                .digest('hex');

            if (signature !== expectedSignature) {
                console.error('[Fluxbase Webhook] Invalid signature');
                return NextResponse.json({ success: false, error: 'Invalid signature' }, { status: 401 });
            }
        }

        const payload = JSON.parse(bodyText);
        console.log('[Fluxbase Webhook] Payload:', JSON.stringify(payload, null, 2));
        
        // Support both old and new v4.0 field names
        const type = payload.type || payload.event_type;
        const table = payload.table || payload.table_id || payload.table_name;
        const data = payload.data || { new: payload.new, old: payload.old };

        console.log(`[Fluxbase Webhook] Received ${type} for table ${table}`);

        // Broadcast the event to all SSE listeners
        const event = new MessageEvent('update', {
            data: JSON.stringify({
                type,
                table,
                new: data?.new,
                old: data?.old
            })
        });
        
        webhookEventEmitter.dispatchEvent(event);

        return NextResponse.json({ success: true });
    } catch (err: any) {
        console.error('[Fluxbase Webhook] Error:', err.message);
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
