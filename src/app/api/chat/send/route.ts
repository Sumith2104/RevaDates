import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/fluxbase/server';
import { v4 as uuidv4 } from 'uuid';
import { webhookEventEmitter } from '@/lib/events';

function getISTTimestamp() {
    return new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Kolkata' }).replace(' ', 'T') + '+05:30';
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { matchId, senderId, recipientId, content, tempId } = body;
        console.log(`[API Chat Send] Received message from ${senderId} to ${recipientId} for chat ${matchId}`);

        if (!matchId || !senderId || !recipientId || !content) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const id = uuidv4();
        const now = getISTTimestamp();

        await pool.query(
            'INSERT INTO messages (id, match_id, sender_id, recipient_id, content, created_at, is_read) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [id, matchId, senderId, recipientId, content, now, false]
        );

        // Manually trigger a local update event so that SSE listeners on this same machine 
        // see the new message instantly, even if the public webhook from Fluxbase 
        // hasn't arrived yet (useful for localhost testing without ngrok).
        const msgEvent = new MessageEvent('update', {
            data: JSON.stringify({
                type: 'INSERT',
                table: 'messages',
                new: { id, match_id: matchId, sender_id: senderId, recipient_id: recipientId, content, created_at: now, is_read: false }
            })
        });
        webhookEventEmitter.dispatchEvent(msgEvent);

        return NextResponse.json({
            data: { id, match_id: matchId, sender_id: senderId, recipient_id: recipientId, content, created_at: now, is_read: false },
            error: null
        });
    } catch (e: any) {
        console.error('[Chat Send] Error:', e.message);
        return NextResponse.json({ data: null, error: 'Could not send the message.' }, { status: 500 });
    }
}
