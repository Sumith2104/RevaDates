'use server';
 
// Hex utilities to bypass Fluxbase slash-mangling bug
function encodeToHex(str: string): string {
    return Buffer.from(str, 'utf8').toString('hex');
}

function decodeFromHex(hex: string): string {
    // Basic check: s3Keys with slashes are already mangled, whereas hex won't have slashes
    // However, if it's already a full URL, we leave it alone (legacy)
    if (hex.startsWith('http')) return hex;
    try {
        const decoded = Buffer.from(hex, 'hex').toString('utf8');
        // If it was valid hex and contains indicators of an s3Key (like / or buckets), it's probably ours
        if (decoded.includes('/') || decoded.includes('buckets')) return decoded;
        return hex; // Fallback to raw if decoding doesn't look right
    } catch (e) {
        return hex;
    }
}
 

import { z } from 'zod';
import { sendEmail } from './email';
import pool from '@/lib/fluxbase/server';
import { revalidatePath } from 'next/cache';
import { getPresignedUrl } from './fluxbase/storage';
import { addMinutes, differenceInYears } from 'date-fns';
import { toZonedTime, format } from 'date-fns-tz';
import { v4 as uuidv4 } from 'uuid';

const EmailSchema = z.object({
    email: z.string().email({ message: 'Please enter a valid email address.' }),
});

const timeZone = 'Asia/Kolkata';

function getISTTimestamp() {
    const now = new Date();
    const zonedDate = toZonedTime(now, timeZone);
    return format(zonedDate, "yyyy-MM-dd'T'HH:mm:ss.SSSXXX", { timeZone });
}

function getFutureISTTimestamp(minutesToAdd: number) {
    const now = new Date();
    const futureDate = addMinutes(now, minutesToAdd);
    const zonedDate = toZonedTime(futureDate, timeZone);
    return format(zonedDate, "yyyy-MM-dd'T'HH:mm:ss.SSSXXX", { timeZone });
}

function createModernEmailTemplate({ title, preheader, body, code, name }: { title: string, preheader: string, body: string, code?: string, name?: string }) {
    const greeting = name ? `<p>Hi ${name},</p>` : '';
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
        <style>body { font-family: sans-serif; background: #000; color: #fff; padding: 20px; }</style>
    </head>
    <body>
        <span style="display: none;">${preheader}</span>
        <div>
            <h1>RevaDates</h1>
            ${greeting}
            <p>${body}</p>
            ${code ? `<h2>${code}</h2>` : ''}
        </div>
    </body>
    </html>`;
}

export async function loginUser(email: string, password?: string) {
    if (!email || !password) return { error: 'Email and password required' };
    try {
        const [rows]: any = await pool.query('SELECT id, name FROM profiles WHERE email = ? AND password = ? LIMIT 1', [email, password]);
        if (rows.length === 0) return { error: 'Invalid credentials' };
        return { data: rows[0] };
    } catch (err: any) {
        return { error: 'Database connection failed: ' + err.message };
    }
}

export async function checkEmailExists(email: string) {
    try {
        const [rows]: any = await pool.query('SELECT id FROM profiles WHERE email = ? LIMIT 1', [email]);
        if (rows.length === 0) return { error: 'No Account Found' };
        return { data: rows[0] };
    } catch (err: any) {
        return { error: 'Database connection failed: ' + err.message };
    }
}

export async function createUser(userData: Record<string, any>) {
    const now = getISTTimestamp();
    const id = uuidv4();

    try {
        await pool.query(
            'INSERT INTO profiles (id, name, email, password, dob, gender, discovery_gender_preference, bio, photos, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [id, `${userData.firstName} ${userData.lastName}`, userData.email, userData.password, `${userData.dobYear}-${userData.dobMonth}-${userData.dobDay}`, userData.gender, userData.genderPreference, "", JSON.stringify([]), now, now]
        );
        return { data: { id } };
    } catch (err: any) {
        return { data: null, error: err.message };
    }
}

export async function sendOtpEmail(email: string, firstName: string) {
    const validatedFields = EmailSchema.safeParse({ email });
    if (!validatedFields.success) return { error: 'Invalid email address provided.', otp: null };

    try {
        const [rows]: any = await pool.query('SELECT id FROM profiles WHERE email = ? LIMIT 1', [validatedFields.data.email]);
        if (rows.length > 0) return { error: 'An account with this email already exists.', otp: null };

        const otp = Math.floor(1000 + Math.random() * 9000).toString();
        const emailHtml = createModernEmailTemplate({
            title: 'Your RevaDates Verification Code',
            preheader: `Your verification code is ${otp}`,
            body: 'Welcome to RevaDates! To finish setting up your account, please use the following verification code:',
            code: otp,
            name: firstName,
        });
        await sendEmail({ to: validatedFields.data.email, subject: 'Your RevaDates Verification Code', html: emailHtml });
        return { error: null, otp };
    } catch (e: any) {
        return { error: 'Failed to process request: ' + e.message, otp: null };
    }
}

export async function handleSwipeAction(swiperId: string, swipedId: string, action: 'liked' | 'rejected') {
    if (!swiperId || !swipedId) return { error: 'Invalid user IDs provided.' };
    const now = getISTTimestamp();
    try {
        await pool.query(
            'INSERT INTO swipes (swiper_id, swiped_id, action, created_at) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE action=VALUES(action)',
            [swiperId, swipedId, action, now]
        );

        if (action === 'liked') {
            const [swiperRows]: any = await pool.query('SELECT name, match_notification FROM profiles WHERE id = ?', [swiperId]);
            if (swiperRows.length > 0) {
                const swiperProfile = swiperRows[0];
                await pool.query(
                    'INSERT INTO notifications (recipient_id, sender_id, type, message, created_at, is_read) VALUES (?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE message=VALUES(message)',
                    [swipedId, swiperId, 'new_like', `${swiperProfile.name} liked your profile!`, now, false]
                );

                const [mutualRows]: any = await pool.query('SELECT swiper_id FROM swipes WHERE swiper_id = ? AND swiped_id = ? AND action = ? LIMIT 1', [swipedId, swiperId, 'liked']);
                if (mutualRows.length > 0) {
                    const [swipedRows]: any = await pool.query('SELECT name, match_notification FROM profiles WHERE id = ?', [swipedId]);
                    const swipedProfile = swipedRows[0];

                    const matchId = uuidv4();
                    await pool.query('INSERT IGNORE INTO matches (id, user1_id, user2_id, created_at) VALUES (?, ?, ?, ?)', [matchId, swiperId, swipedId, now]);

                    if (swiperProfile.match_notification) {
                        await pool.query('INSERT INTO notifications (recipient_id, sender_id, type, message, created_at, is_read) VALUES (?, ?, ?, ?, ?, ?)', [swiperId, swipedId, 'new_match', `You matched with ${swipedProfile.name}!`, now, false]);
                    }
                    if (swipedProfile?.match_notification) {
                        await pool.query('INSERT INTO notifications (recipient_id, sender_id, type, message, created_at, is_read) VALUES (?, ?, ?, ?, ?, ?)', [swipedId, swiperId, 'new_match', `You matched with ${swiperProfile.name}!`, now, false]);
                    }
                    revalidatePath('/chats');
                    revalidatePath('/notifications');
                    return { match: true, matchId };
                }
            }
        }
        revalidatePath('/notifications');
        return { success: true };
    } catch (err) {
        return { error: 'Could not record your swipe.' };
    }
}

export async function sendPasswordResetOtp(email: string) {
    const validatedFields = EmailSchema.safeParse({ email });
    if (!validatedFields.success) return { error: 'Invalid email address.' };

    try {
        const [rows]: any = await pool.query('SELECT id, email, name FROM profiles WHERE email = ? LIMIT 1', [validatedFields.data.email]);
        if (rows.length === 0) return { error: "No account found with that email address." };

        const user = rows[0];
        const otp = Math.floor(1000 + Math.random() * 9000).toString();
        const expires = getFutureISTTimestamp(10);
        await pool.query('UPDATE profiles SET password_reset_token = ?, password_reset_token_expires_at = ?, updated_at = ? WHERE id = ?', [otp, expires, getISTTimestamp(), user.id]);

        const firstName = user.name.split(' ')[0];
        const emailHtml = createModernEmailTemplate({
            title: 'Your RevaDates Password Reset Code',
            preheader: `Your password reset code is ${otp}`,
            body: 'We received a request to reset your password. Use the code below to set up a new password.',
            code: otp,
            name: firstName
        });
        await sendEmail({ to: user.email, subject: 'Your RevaDates Password Reset Code', html: emailHtml });
        return { success: true };
    } catch (e: any) {
        return { error: "Could not send the password reset code: " + e.message };
    }
}

const PasswordResetSchema = z.object({
    email: z.string().email(),
    otp: z.string().length(4, 'OTP must be 4 digits.'),
    password: z.string().min(6, 'Password must be at least 6 characters.'),
});

export async function resetPasswordWithOtp(email: string, otp: string, password: string) {
    const validatedFields = PasswordResetSchema.safeParse({ email, otp, password });
    if (!validatedFields.success) return { error: validatedFields.error.errors[0]?.message || 'Invalid input.' };

    try {
        const [rows]: any = await pool.query('SELECT id, password_reset_token_expires_at FROM profiles WHERE email = ? AND password_reset_token = ? LIMIT 1', [email, otp]);
        if (rows.length === 0 || !rows[0].password_reset_token_expires_at) return { error: 'Invalid or expired reset code.' };

        const expires = new Date(rows[0].password_reset_token_expires_at);
        if (expires < new Date()) return { error: 'Invalid or expired reset code.' };

        await pool.query('UPDATE profiles SET password = ?, password_reset_token = NULL, password_reset_token_expires_at = NULL, updated_at = ? WHERE id = ?', [password, getISTTimestamp(), rows[0].id]);
        return { success: true };
    } catch (err: any) {
        return { error: 'Database connection failed: ' + err.message };
    }
}

export async function handleUndoSwipeAction(swiperId: string, swipedId: string) {
    if (!swiperId || !swipedId) return { error: 'Invalid user IDs provided for undo.' };
    try {
        await pool.query('DELETE FROM swipes WHERE swiper_id = ? AND swiped_id = ?', [swiperId, swipedId]);
        return { success: true };
    } catch (err: any) {
        return { error: 'Database connection failed: ' + err.message };
    }
}

export async function getNotifications(userId: string) {
    if (!userId) return { data: [], error: 'User ID is required.' };
    try {
        const [rows]: any = await pool.query(`
            SELECT n.id, n.message, n.created_at, n.is_read, n.type, n.sender_id, p.name as sender_name, p.photos as sender_photos
            FROM notifications n
            LEFT JOIN profiles p ON n.sender_id = p.id
            WHERE n.recipient_id = ?
            ORDER BY n.created_at DESC
        `, [userId]);
        
        const data = await Promise.all(rows.map(async (r: any) => {
            const rawPhotos = r.sender_photos ? JSON.parse(r.sender_photos) : [];
            const resolvedPhotos = await Promise.all(rawPhotos.map((p: string) => getPresignedUrl(p)));
            return {
                id: r.id, 
                message: r.message, 
                created_at: r.created_at, 
                is_read: r.is_read, 
                type: r.type, 
                sender_id: r.sender_id,
                sender: { 
                    name: r.sender_name, 
                    photos: resolvedPhotos.filter(Boolean) as string[]
                }
            };
        }));
        return { data, error: null };
    } catch (e) {
        return { data: [], error: 'Could not fetch notifications.' };
    }
}

export async function markNotificationsAsRead(userId: string) {
    if (!userId) return { error: 'User ID is required.' };
    const now = getISTTimestamp();
    await pool.query('UPDATE notifications SET is_read = true, updated_at = ? WHERE recipient_id = ? AND is_read = false', [now, userId]);
    revalidatePath('/notifications');
    return { success: true };
}

export async function blockUser(blockerId: string, blockedId: string) {
    if (!blockerId || !blockedId) return { error: 'Invalid user IDs provided.' };
    try {
        const [rows]: any = await pool.query('SELECT blocked_users FROM profiles WHERE id = ?', [blockerId]);
        if (rows.length > 0) {
            const blocks = rows[0].blocked_users ? JSON.parse(rows[0].blocked_users) : [];
            if (!blocks.includes(blockedId)) blocks.push(blockedId);
            await pool.query('UPDATE profiles SET blocked_users = ? WHERE id = ?', [JSON.stringify(blocks), blockerId]);
        }
        await pool.query('DELETE FROM swipes WHERE (swiper_id = ? AND swiped_id = ?) OR (swiper_id = ? AND swiped_id = ?)', [blockerId, blockedId, blockedId, blockerId]);
        await pool.query('DELETE FROM matches WHERE (user1_id = ? AND user2_id = ?) OR (user1_id = ? AND user2_id = ?)', [blockerId, blockedId, blockedId, blockerId]);
        revalidatePath('/dashboard');
        return { success: true };
    } catch (e) {
        return { error: 'Could not block the user.' };
    }
}

export async function getBlockedUsers(userId: string) {
    if (!userId) return { data: [], error: 'User ID is required.' };
    try {
        const [rows]: any = await pool.query('SELECT blocked_users FROM profiles WHERE id = ?', [userId]);
        if (rows.length === 0 || !rows[0].blocked_users) return { data: [], error: 'Could not fetch blocked users.' };
        const blockedUserIds = JSON.parse(rows[0].blocked_users);
        if (blockedUserIds.length === 0) return { data: [], error: null };
        const placeholders = blockedUserIds.map(() => '?').join(',');
        const [profiles]: any = await pool.query(`SELECT id, name, photos FROM profiles WHERE id IN (${placeholders})`, blockedUserIds);
        const data = profiles.map((p: any) => ({ ...p, photos: p.photos ? JSON.parse(p.photos) : [] }));
        return { data, error: null };
    } catch (e: any) {
        return { data: [], error: 'Database connection failed: ' + e.message };
    }
}

export async function unblockUser(blockerId: string, unblockedId: string) {
    if (!blockerId || !unblockedId) return { error: 'Invalid user IDs provided.' };
    try {
        const [rows]: any = await pool.query('SELECT blocked_users FROM profiles WHERE id = ?', [blockerId]);
        if (rows.length === 0) return { error: 'Could not find user profile.' };
        const blocks = rows[0].blocked_users ? JSON.parse(rows[0].blocked_users) : [];
        const newBlocks = blocks.filter((id: string) => id !== unblockedId);
        await pool.query('UPDATE profiles SET blocked_users = ?, updated_at = ? WHERE id = ?', [JSON.stringify(newBlocks), getISTTimestamp(), blockerId]);
        revalidatePath('/settings');
        return { success: true };
    } catch (e: any) {
        return { error: 'Database connection failed: ' + e.message };
    }
}

export async function getChatsAndMatches(userId: string) {
    if (!userId) return { chats: [], matches: [], error: 'User ID is required.', unreadChatCount: 0, unreadNotificationCount: 0 };

    try {
        const [mRows]: any = await pool.query('SELECT id, user1_id, user2_id, created_at FROM matches WHERE user1_id = ? OR user2_id = ? ORDER BY created_at DESC', [userId, userId]);
        const allMatches = mRows;

        const [nRows]: any = await pool.query('SELECT COUNT(*) as count FROM notifications WHERE recipient_id = ? AND is_read = false', [userId]);
        const unreadNotificationCount = nRows[0].count || 0;

        if (!allMatches || allMatches.length === 0) {
            return { chats: [], matches: [], error: null, unreadChatCount: 0, unreadNotificationCount };
        }

        const matchIds = allMatches.map((m: any) => m.id);
        const matchIdsPlaceholders = matchIds.map(() => '?').join(',');

        const [msgRows]: any = await pool.query(`SELECT match_id, content, created_at, is_read, recipient_id FROM messages WHERE match_id IN (${matchIdsPlaceholders}) ORDER BY created_at DESC`, matchIds);
        const allMessages = msgRows;

        const lastMessageMap = new Map<string, { content: string; created_at: string }>();
        const unreadCounts = new Map<string, number>();
        let totalUnreadChatCount = 0;

        if (allMessages) {
            for (const msg of allMessages) {
                if (!lastMessageMap.has(msg.match_id)) {
                    lastMessageMap.set(msg.match_id, { content: msg.content, created_at: msg.created_at });
                }
                if (msg.recipient_id === userId && !msg.is_read) {
                    unreadCounts.set(msg.match_id, (unreadCounts.get(msg.match_id) || 0) + 1);
                    totalUnreadChatCount++;
                }
            }
        }

        const chats = allMatches.filter((m: any) => lastMessageMap.has(m.id));
        const newMatches = allMatches.filter((m: any) => !lastMessageMap.has(m.id));

        const allMatchedUserIds = allMatches.map((m: any) => (m.user1_id === userId ? m.user2_id : m.user1_id));
        const matchedUserPlaceholders = allMatchedUserIds.map(() => '?').join(',');

        let profilesById = new Map();
        if (allMatchedUserIds.length > 0) {
            const [pRows]: any = await pool.query(`SELECT id, name, photos FROM profiles WHERE id IN (${matchedUserPlaceholders})`, allMatchedUserIds);
            
            const resolvedProfiles = await Promise.all(pRows.map(async (p: any) => {
                const rawPhotos = p.photos ? JSON.parse(p.photos).map(decodeFromHex) : [];
                const resolvedPhotos = await Promise.all(rawPhotos.map((photo: string) => getPresignedUrl(photo)));
                return [p.id, { ...p, photos: resolvedPhotos.filter(Boolean) as string[] }];
            }));
            
            profilesById = new Map(resolvedProfiles);
        }

        const formattedChats = chats.map((match: any) => {
            const matchedUserId = match.user1_id === userId ? match.user2_id : match.user1_id;
            const matchedUser = profilesById.get(matchedUserId);
            const lastMessage = lastMessageMap.get(match.id);
            return {
                id: match.id,
                matchedUser: { id: matchedUser?.id, name: matchedUser?.name, photos: matchedUser?.photos },
                lastMessage: lastMessage?.content || null,
                lastMessageTime: lastMessage?.created_at || null,
                unreadCount: unreadCounts.get(match.id) || 0,
            };
        }).sort((a: any, b: any) => {
            if (!a.lastMessageTime) return 1;
            if (!b.lastMessageTime) return -1;
            return new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime();
        });

        const formattedMatches = newMatches.map((match: any) => {
            const matchedUserId = match.user1_id === userId ? match.user2_id : match.user1_id;
            const matchedUser = profilesById.get(matchedUserId);
            return {
                id: match.id,
                matchedUser: { id: matchedUser?.id, name: matchedUser?.name, photos: matchedUser?.photos }
            };
        });

        return { chats: formattedChats, matches: formattedMatches, error: null, unreadChatCount: totalUnreadChatCount, unreadNotificationCount };
    } catch (e) {
        return { chats: [], matches: [], error: 'Could not fetch your matches.', unreadChatCount: 0, unreadNotificationCount: 0 };
    }
}

export async function updateUserProfile(userId: string, updates: { name: string; bio: string; }) {
    if (!userId) return { error: 'User ID is required.' };
    try {
        await pool.query('UPDATE profiles SET name = ?, bio = ?, updated_at = ? WHERE id = ?', [updates.name, updates.bio, getISTTimestamp(), userId]);
        revalidatePath('/profile');
        revalidatePath('/dashboard');
        return { success: true };
    } catch (e) {
        return { error: 'Could not update your profile.' };
    }
}

export async function updateUserProfilePhotos(userId: string, photos: string[]) {
    if (!userId) return { error: 'User ID is required.' };
    try {
        // Ensure we only save strings that looks like s3Keys (not full URLs)
        const cleanPhotos = photos.filter(p => p && !p.startsWith('http'));
        // Hex encode to bypass Fluxbase mangling
        const hexPhotos = cleanPhotos.map(p => encodeToHex(p));
        await pool.query('UPDATE profiles SET photos = ?, updated_at = ? WHERE id = ?', [JSON.stringify(hexPhotos), getISTTimestamp(), userId]);
        revalidatePath('/profile');
        return { success: true };
    } catch (e) {
        return { error: 'Could not update your photos.' };
    }
}

export async function addUserPhotoAction(userId: string, s3Key: string) {
    console.log(`[PhotoAction] Called with userId: ${userId}, s3Key: ${s3Key}`);
    if (!userId || !s3Key) {
        console.error('[PhotoAction] Missing userId or s3Key');
        return { error: 'Missing information' };
    }
    try {
        const [rows]: any = await pool.query('SELECT photos FROM profiles WHERE id = ? LIMIT 1', [userId]);
        if (rows.length === 0) return { error: 'Profile not found' };
        
        const photosRaw = rows[0].photos;
        let currentPhotos: string[] = [];
        if (photosRaw) {
            try {
                const parsed = JSON.parse(photosRaw);
                currentPhotos = Array.isArray(parsed) ? parsed.map(decodeFromHex) : [];
            } catch (pErr) {
                console.error(`[PhotoAction] JSON Parse Error:`, pErr);
            }
        }
        
        console.log(`[PhotoAction] Current photos (decoded):`, currentPhotos);
        
        // Add new key, then hex-encode the whole array for saving
        const updatedPhotos = [s3Key, ...currentPhotos];
        const hexPhotos = updatedPhotos.map(encodeToHex);
        
        const sqlResult: any = await pool.query('UPDATE profiles SET photos = ?, updated_at = ? WHERE id = ?', [JSON.stringify(hexPhotos), getISTTimestamp(), userId]);
        console.log(`[PhotoAction] Update query finished. Result:`, JSON.stringify(sqlResult));
        
        const presignedUrl = await getPresignedUrl(s3Key);
        
        revalidatePath('/profile');
        return { success: true, presignedUrl };
    } catch (e: any) {
        console.error(`[PhotoAction] CRITICAL ERROR:`, e);
        return { error: 'Failed to add photo: ' + e.message };
    }
}

export async function deletePhotoAction(userId: string, keyToDelete: string) {
    if (!userId || !keyToDelete) return { error: 'Missing information' };
    try {
        const [rows]: any = await pool.query('SELECT photos FROM profiles WHERE id = ? LIMIT 1', [userId]);
        if (rows.length === 0) return { error: 'Profile not found' };
        
        let currentPhotos = rows[0].photos ? JSON.parse(rows[0].photos).map(decodeFromHex) : [];
        const updatedPhotos = currentPhotos.filter((k: string) => k !== keyToDelete && !keyToDelete.includes(k));
        
        const hexPhotos = updatedPhotos.map(encodeToHex);
        await pool.query('UPDATE profiles SET photos = ?, updated_at = ? WHERE id = ?', [JSON.stringify(hexPhotos), getISTTimestamp(), userId]);
        
        // Resolve new URLs
        const resolvedPhotos = await Promise.all(updatedPhotos.map((p: string) => getPresignedUrl(p)));
        
        revalidatePath('/profile');
        return { success: true, photos: resolvedPhotos.filter(Boolean) as string[] };
    } catch (e) {
        return { error: 'Failed to delete photo' };
    }
}

export async function setPrimaryPhotoAction(userId: string, keyToMakePrimary: string) {
    if (!userId || !keyToMakePrimary) return { error: 'Missing information' };
    try {
        const [rows]: any = await pool.query('SELECT photos FROM profiles WHERE id = ? LIMIT 1', [userId]);
        if (rows.length === 0) return { error: 'Profile not found' };
        
        let currentPhotos = rows[0].photos ? JSON.parse(rows[0].photos).map(decodeFromHex) : [];
        const index = currentPhotos.findIndex((k: string) => k === keyToMakePrimary || keyToMakePrimary.includes(k));
        
        if (index === -1) return { error: 'Photo not found in profile' };
        
        const key = currentPhotos.splice(index, 1)[0];
        const updatedPhotos = [key, ...currentPhotos];
        
        const hexPhotos = updatedPhotos.map(encodeToHex);
        await pool.query('UPDATE profiles SET photos = ?, updated_at = ? WHERE id = ?', [JSON.stringify(hexPhotos), getISTTimestamp(), userId]);
        
        // Resolve new URLs
        const resolvedPhotos = await Promise.all(updatedPhotos.map((p: string) => getPresignedUrl(p)));
        
        revalidatePath('/profile');
        return { success: true, photos: resolvedPhotos.filter(Boolean) as string[] };
    } catch (e) {
        return { error: 'Failed to set primary photo' };
    }
}

export async function respondToLike(notificationId: string, recipientId: string, senderId: string, action: 'liked' | 'rejected') {
    if (!notificationId || !recipientId || !senderId) return { error: 'Invalid IDs provided.' };
    const now = getISTTimestamp();
    try {
        await pool.query('INSERT INTO swipes (swiper_id, swiped_id, action, created_at) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE action=VALUES(action)', [recipientId, senderId, action, now]);
        await pool.query('DELETE FROM notifications WHERE id = ?', [notificationId]);

        if (action === 'liked') {
            const [rows]: any = await pool.query('SELECT swiper_id FROM swipes WHERE swiper_id = ? AND swiped_id = ? AND action = ? LIMIT 1', [senderId, recipientId, 'liked']);
            if (rows.length > 0) {
                const matchId = uuidv4();
                await pool.query('INSERT IGNORE INTO matches (id, user1_id, user2_id, created_at) VALUES (?, ?, ?, ?)', [matchId, recipientId, senderId, now]);

                const [pRows]: any = await pool.query('SELECT id, name, match_notification FROM profiles WHERE id IN (?, ?)', [recipientId, senderId]);
                const recipientProfile = pRows.find((p: any) => p.id === recipientId);
                const senderProfile = pRows.find((p: any) => p.id === senderId);

                if (senderProfile?.match_notification) {
                    await pool.query('INSERT INTO notifications (recipient_id, sender_id, type, message, created_at, is_read) VALUES (?, ?, ?, ?, ?, ?)', [senderId, recipientId, 'new_match', `You matched with ${recipientProfile?.name}!`, now, false]);
                }
                revalidatePath('/chats');
                revalidatePath('/notifications');
                return { match: true, matchId };
            }
        }
        revalidatePath('/notifications');
        return { success: true };
    } catch (e) {
        return { error: 'Could not record your response.' };
    }
}
export async function getChatMessages(matchId: string) {
    if (!matchId) return { data: [], error: 'Match ID is required.' };
    try {
        const [rows]: any = await pool.query('SELECT * FROM messages WHERE match_id = ? ORDER BY created_at ASC', [matchId]);
        return { data: rows, error: null };
    } catch (e) {
        return { data: null, error: 'Could not fetch messages.' };
    }
}

export async function sendMessage(matchId: string, senderId: string, recipientId: string, content: string, tempId?: string) {
    if (!matchId || !senderId || !content) return { data: null, error: 'Missing required fields to send message.' };
    const now = getISTTimestamp();
    const id = uuidv4();
    try {
        await pool.query('INSERT INTO messages (id, match_id, sender_id, recipient_id, content, created_at, is_read) VALUES (?, ?, ?, ?, ?, ?, ?)', [id, matchId, senderId, recipientId, content, now, false]);
        const [rows]: any = await pool.query('SELECT * FROM messages WHERE id = ?', [id]);
        const data = rows[0];
        const returnedData = data ? { ...data, tempId: tempId } : null;
        revalidatePath(`/chats/${matchId}`);
        revalidatePath('/chats');
        return { data: returnedData, error: null };
    } catch (e) {
        return { data: null, error: 'Could not send the message.' };
    }
}

export async function getMatchDetails(matchId: string, currentUserId: string) {
    if (!matchId) return { data: null, error: 'Match ID required' };
    try {
        const [rows]: any = await pool.query('SELECT user1_id, user2_id FROM matches WHERE id = ? LIMIT 1', [matchId]);
        if (rows.length === 0) return { data: null, error: 'Could not find match details.' };
        const match = rows[0];
        const otherUserId = match.user1_id === currentUserId ? match.user2_id : match.user1_id;
        const [pRows]: any = await pool.query('SELECT id, name, photos FROM profiles WHERE id = ? LIMIT 1', [otherUserId]);
        if (pRows.length === 0) return { data: null, error: 'Could not find matched user profile.' };
        const rawPhotos = pRows[0].photos ? JSON.parse(pRows[0].photos) : [];
        const resolvedPhotos = await Promise.all(rawPhotos.map((p: string) => getPresignedUrl(p)));
        const profile = { ...pRows[0], photos: resolvedPhotos.filter(Boolean) as string[] };
        return { data: profile, error: null };
    } catch (e) {
        return { data: null, error: 'Error finding match details.' };
    }
}

export async function markMessagesAsRead(matchId: string, userId: string) {
    if (!matchId || !userId) return { error: 'Match ID and User ID are required.' };
    try {
        await pool.query('UPDATE messages SET is_read = true WHERE match_id = ? AND recipient_id = ? AND is_read = false', [matchId, userId]);
        revalidatePath(`/chats/${matchId}`);
        return { success: true };
    } catch (e) {
        return { error: 'Could not mark messages as read.' };
    }
}

export async function updateUserLocation(userId: string, lat: number, lon: number) {
    if (!userId) return { error: 'User ID is required.' };
    if (lat === undefined || lon === undefined) return { error: 'Latitude and Longitude are required.' };
    try {
        // MySQL does not have a strict PostGIS standard POINT syntax universally applied, passing as string representation for simplicity to replace standard PostGIS calls if any.
        // Usually, in a real env, ST_PointFromText is used. We will just save lat and lon if columns allow, but previous app used text string `POINT(lon lat)`.
        const locationString = `POINT(${lon} ${lat})`;
        await pool.query('UPDATE profiles SET location = ?, updated_at = ? WHERE id = ?', [locationString, getISTTimestamp(), userId]);
        return { success: true };
    } catch (e) {
        return { error: 'Could not update your location.' };
    }
}

export async function getDistanceBetweenUsers(userA: string, userB: string): Promise<number | null> {
    // Assuming MySQL ST_Distance_Sphere is available
    try {
        const [rows]: any = await pool.query(`
            SELECT ST_Distance_Sphere(ST_GeomFromText(p1.location), ST_GeomFromText(p2.location)) / 1000 AS distance_km
            FROM profiles p1, profiles p2
            WHERE p1.id = ? AND p2.id = ?
        `, [userA, userB]);
        if (rows.length > 0 && rows[0].distance_km !== null) return rows[0].distance_km;
        return null;
    } catch (e) {
        return null;
    }
}

export async function getIsMatch(userA: string, userB: string): Promise<boolean> {
    if (!userA || !userB) return false;
    try {
        const [rows]: any = await pool.query('SELECT id FROM matches WHERE (user1_id = ? AND user2_id = ?) OR (user1_id = ? AND user2_id = ?) LIMIT 1', [userA, userB, userB, userA]);
        return rows.length > 0;
    } catch (e) {
        return false;
    }
}

export async function sendLoginOtp(email: string) {
    const validatedFields = EmailSchema.safeParse({ email });
    if (!validatedFields.success) return { error: 'Invalid email address.' };

    try {
        const [rows]: any = await pool.query('SELECT id, email, name FROM profiles WHERE email = ? LIMIT 1', [validatedFields.data.email]);
        if (rows.length === 0) return { error: "No account found with that email address." };

        const user = rows[0];
        const otp = Math.floor(1000 + Math.random() * 9000).toString();
        const expires = getFutureISTTimestamp(10);
        await pool.query('UPDATE profiles SET password_reset_token = ?, password_reset_token_expires_at = ?, updated_at = ? WHERE id = ?', [otp, expires, getISTTimestamp(), user.id]);

        const firstName = user.name.split(' ')[0];
        const emailHtml = createModernEmailTemplate({
            title: 'Your RevaDates Login Code',
            preheader: `Your login code is ${otp}`,
            body: 'We received a request to log in to your account. Use the code below to sign in.',
            code: otp,
            name: firstName
        });
        await sendEmail({ to: user.email, subject: 'Your RevaDates Login Code', html: emailHtml });
        return { success: true };
    } catch (e: any) {
        return { error: "Could not process login code request: " + e.message };
    }
}

export async function verifyLoginOtp(email: string, otp: string) {
    try {
        const [rows]: any = await pool.query('SELECT id, password_reset_token_expires_at FROM profiles WHERE email = ? AND password_reset_token = ? LIMIT 1', [email, otp]);
        if (rows.length === 0 || !rows[0].password_reset_token_expires_at) return { error: 'Invalid or expired login code.', userId: null };
        const expires = new Date(rows[0].password_reset_token_expires_at);
        if (expires < new Date()) return { error: 'Invalid or expired login code.', userId: null };
        await pool.query('UPDATE profiles SET password_reset_token = NULL, password_reset_token_expires_at = NULL, updated_at = ? WHERE id = ?', [getISTTimestamp(), rows[0].id]);
        return { success: true, userId: rows[0].id };
    } catch (e) {
        return { error: 'Database error', userId: null };
    }
}

export async function getPotentialProfiles(currentUserId: string, offset: number = 0, limit: number = 50) {
    if (!currentUserId) return { data: null, error: 'User ID is required.' };
    try {
        const [uRows]: any = await pool.query('SELECT discovery_age_min, discovery_age_max, discovery_gender_preference, blocked_users FROM profiles WHERE id = ? LIMIT 1', [currentUserId]);
        if (uRows.length === 0) return { data: null, error: "Could not load your profile settings." };
        const { discovery_age_min: minAge, discovery_age_max: maxAge, discovery_gender_preference: genderPreference } = uRows[0];
        const blockedUsers = uRows[0].blocked_users ? JSON.parse(uRows[0].blocked_users) : [];

        const [sRows]: any = await pool.query('SELECT swiped_id FROM swipes WHERE swiper_id = ?', [currentUserId]);
        const swipedUserIds = sRows.map((item: any) => item.swiped_id);

        const [mRows]: any = await pool.query('SELECT user1_id, user2_id FROM matches WHERE user1_id = ? OR user2_id = ?', [currentUserId, currentUserId]);
        const matchedUserIds = mRows.flatMap((m: any) => [m.user1_id, m.user2_id]).filter((id: string) => id !== currentUserId);

        const excludedIds = Array.from(new Set([currentUserId, ...swipedUserIds, ...matchedUserIds, ...blockedUsers]));

        let queryStr = 'SELECT *, dob FROM profiles';
        const params: any[] = [];
        const conditions: string[] = [];

        if (excludedIds.length > 0) {
            conditions.push(`id NOT IN (${excludedIds.map(() => '?').join(',')})`);
            params.push(...excludedIds);
        }
        if (genderPreference === 'men') {
            conditions.push("gender = 'Male'");
        } else if (genderPreference === 'women') {
            conditions.push("gender = 'Female'");
        }

        if (conditions.length > 0) queryStr += ' WHERE ' + conditions.join(' AND ');
        // Fetch extra rows to account for ones filtered out by age; we slice to 'limit' after in-memory filtering
        queryStr += ` ORDER BY created_at DESC LIMIT ${limit * 3} OFFSET ${offset}`;

        const [pRows]: any = await pool.query(queryStr, params);

        const filtered = await Promise.all(pRows.map(async (profile: any) => {
            const age = differenceInYears(new Date(), new Date(profile.dob));
            const rawPhotos = profile.photos ? JSON.parse(profile.photos).map(decodeFromHex) : [];
            const resolvedPhotos = await Promise.all(rawPhotos.map((p: string) => getPresignedUrl(p)));
            return { 
                ...profile, 
                age, 
                photos: resolvedPhotos.filter(Boolean) as string[] 
            };
        }));
        
        const page = filtered
            .filter((profile: any) => profile.age >= (minAge || 18) && profile.age <= (maxAge || 80))
            .slice(0, limit);

        const profilesWithDistance = await Promise.all(
            page.map(async (profile: any) => {
                const distance = await getDistanceBetweenUsers(currentUserId, profile.id);
                return { ...profile, distance_meters: distance !== null ? distance * 1000 : null };
            })
        );

        return { data: profilesWithDistance, error: null, hasMore: filtered.length > limit };
    } catch (e) {
        return { data: null, error: "Could not fetch new profiles.", hasMore: false };
    }
}

export async function getUnreadCounts(userId: string) {
    if (!userId) return { error: 'User ID is required.', unreadChatCount: 0, unreadNotificationCount: 0 };
    try {
        const [cRows]: any = await pool.query('SELECT COUNT(*) as count FROM messages WHERE recipient_id = ? AND is_read = false', [userId]);
        const [nRows]: any = await pool.query('SELECT COUNT(*) as count FROM notifications WHERE recipient_id = ? AND is_read = false', [userId]);
        return { error: null, unreadChatCount: cRows[0].count || 0, unreadNotificationCount: nRows[0].count || 0 };
    } catch (e) {
        return { error: 'Failed to fetch counts.', unreadChatCount: 0, unreadNotificationCount: 0 };
    }
}

export async function getCurrentUserProfile(userId: string) {
    if (!userId) return { data: null, error: 'User ID required' };
    try {
        const [rows]: any = await pool.query('SELECT * FROM profiles WHERE id = ? LIMIT 1', [userId]);
        if (rows.length === 0) return { data: null, error: 'Profile not found' };
        
        console.log(`[DB] Raw photos for getCurrentUserProfile(${userId}):`, rows[0].photos);
        
        let rawPhotos = rows[0].photos ? JSON.parse(rows[0].photos).map(decodeFromHex) : [];
        // Data Cleanup: filter out full URLs that might have been accidentally saved
        const cleanPhotos = rawPhotos.filter((p: string) => p && !p.startsWith('http'));
        
        // If we found corruption, let's fix it in the DB silently
        if (cleanPhotos.length !== rawPhotos.length) {
            await pool.query('UPDATE profiles SET photos = ? WHERE id = ?', [JSON.stringify(cleanPhotos), userId]);
        }
        
        const resolvedPhotos = await Promise.all(cleanPhotos.map((p: string) => getPresignedUrl(p)));
        return { data: { ...rows[0], photos: resolvedPhotos.filter(Boolean) as string[] }, error: null };
    } catch (e) {
        return { data: null, error: 'Failed to fetch profile' };
    }
}

export async function getUserProfile(userId: string) {
    if (!userId) return { data: null, error: 'User ID required' };
    try {
        const [rows]: any = await pool.query('SELECT * FROM profiles WHERE id = ? LIMIT 1', [userId]);
        if (rows.length === 0) return { data: null, error: 'Profile not found' };
        
        console.log(`[DB] Raw photos for getUserProfile(${userId}):`, rows[0].photos);
        
        let rawPhotos = rows[0].photos ? JSON.parse(rows[0].photos).map(decodeFromHex) : [];
        // Data Cleanup: filter out full URLs that might have been accidentally saved
        const cleanPhotos = rawPhotos.filter((p: string) => p && !p.startsWith('http'));

        // If we found corruption, let's fix it in the DB silently
        if (cleanPhotos.length !== rawPhotos.length) {
            await pool.query('UPDATE profiles SET photos = ? WHERE id = ?', [JSON.stringify(cleanPhotos), userId]);
        }

        const resolvedPhotos = await Promise.all(cleanPhotos.map((p: string) => getPresignedUrl(p)));
        return { data: { ...rows[0], photos: resolvedPhotos.filter(Boolean) as string[] }, error: null };
    } catch (e) {
        return { data: null, error: 'Failed to fetch profile' };
    }
}

export async function updateUserSettings(userId: string, settings: { discovery_age_min: number; discovery_age_max: number; match_notification: boolean }) {
    if (!userId) return { error: 'User ID required' };
    try {
        await pool.query('UPDATE profiles SET discovery_age_min = ?, discovery_age_max = ?, match_notification = ?, updated_at = ? WHERE id = ?', [settings.discovery_age_min, settings.discovery_age_max, settings.match_notification, getISTTimestamp(), userId]);
        return { success: true };
    } catch (e) {
        return { error: 'Failed to update settings' };
    }
}

export async function uploadImageAction(formData: FormData) {
    const file = formData.get('file') as File;
    if (!file) return { error: 'No file provided' };

    const baseUrl = (process.env.FLUX_URL || 'https://api.fluxbase.io').trim();
    const projectId = process.env.FLUX_PROJECT_ID?.trim();
    const apiKey = process.env.FLUX_API?.trim();
    const bucketId = (process.env.FLUX_BUCKET || 'photos').trim();

    if (!projectId || !apiKey) {
        return { error: 'Server configuration error: Missing Fluxbase credentials' };
    }

    const uploadUrl = baseUrl.endsWith('/api')
        ? `${baseUrl}/storage/upload`
        : `${baseUrl}/api/storage/upload`;

    const fluxFormData = new FormData();
    fluxFormData.append('file', file);
    fluxFormData.append('projectId', projectId);
    fluxFormData.append('bucketId', bucketId);

    try {
        console.log(`[UploadAction] Attempting upload to: ${uploadUrl} for bucket: ${bucketId}`);
        const response = await fetch(uploadUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`
            },
            body: fluxFormData
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[UploadAction] Fluxbase Error ${response.status}:`, errorText);
            return { error: `Fluxbase Storage Error ${response.status}: ${errorText}` };
        }

        const data = await response.json();
        console.log('[UploadAction] Success:', JSON.stringify(data));
        
        // V4.0 spec returns s3_key inside a file object
        const s3Key = data.file?.s3_key || data.s3Key || data.key || (data.url ? data.url.split('/').pop() : null);

        if (s3Key) {
            return { s3Key };
        }

        return { error: 'Upload successful but no s3_key returned from Fluxbase' };
    } catch (err: any) {
        return { error: `Server-side upload error: ${err.message}` };
    }
}
