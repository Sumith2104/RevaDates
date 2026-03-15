import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/fluxbase/server';
import { v4 as uuidv4 } from 'uuid';

function getISTTimestamp() {
    return new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Kolkata' }).replace(' ', 'T') + '+05:30';
}

export async function POST(req: NextRequest) {
    try {
        const { matchId, senderId, recipientId, content, tempId } = await req.json();

        if (!matchId || !senderId || !recipientId || !content) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const id = uuidv4();
        const now = getISTTimestamp();

        await pool.query(
            'INSERT INTO messages (id, match_id, sender_id, recipient_id, content, created_at, is_read) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [id, matchId, senderId, recipientId, content, now, false]
        );

        return NextResponse.json({
            data: { id, match_id: matchId, sender_id: senderId, recipient_id: recipientId, content, created_at: now, is_read: false },
            error: null
        });
    } catch (e: any) {
        console.error('[Chat Send] Error:', e.message);
        return NextResponse.json({ data: null, error: 'Could not send the message.' }, { status: 500 });
    }
}
