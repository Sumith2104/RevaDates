
'use server';

import { z } from 'zod';
import { sendEmail } from './email';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { addMinutes } from 'date-fns';
import { toZonedTime, format } from 'date-fns-tz';

const EmailSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address.' }),
});

const timeZone = 'Asia/Kolkata';

// Helper function to get current IST time as ISO string for Supabase
function getISTTimestamp() {
    const now = new Date();
    const zonedDate = toZonedTime(now, timeZone);
    return format(zonedDate, "yyyy-MM-dd'T'HH:mm:ss.SSSXXX", { timeZone });
}

// Helper function to get future IST time as ISO string for Supabase
function getFutureISTTimestamp(minutesToAdd: number) {
    const now = new Date();
    const futureDate = addMinutes(now, minutesToAdd);
    const zonedDate = toZonedTime(futureDate, timeZone);
    return format(zonedDate, "yyyy-MM-dd'T'HH:mm:ss.SSSXXX", { timeZone });
}

export async function createUser(userData: Record<string, any>) {
  const supabase = createClient();
  const now = getISTTimestamp();

  const { data: newUser, error: insertError } = await supabase.from('profiles').insert({
      name: `${userData.firstName} ${userData.lastName}`,
      email: userData.email,
      password: userData.password, 
      dob: `${userData.dobYear}-${userData.dobMonth}-${userData.dobDay}`,
      bio: "Tell us more about yourself! Share a short bio that shows your personality, interests, and what you're looking for. Add your hobbies (e.g., reading, hiking, gaming), what kind of connection you seek (friendship, serious relationship, etc.), and your current city. Upload a few photos that best represent you, and optionally verify your profile to earn a trusted badge. The more complete your profile, the better your matches!",
      photos: [],
      created_at: now,
      updated_at: now,
  }).select('id').single();

  if (insertError) {
      return { data: null, error: insertError.message };
  }

  return { data: newUser, error: null };
}


export async function sendOtpEmail(email: string) {
  const validatedFields = EmailSchema.safeParse({ email });

  if (!validatedFields.success) {
    return {
      error: 'Invalid email address provided.',
      otp: null,
    };
  }
  
  const supabase = createClient();
  const { data: existingUser, error: fetchError } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', validatedFields.data.email)
    .single();

  if(existingUser) {
    return {
      error: 'An account with this email already exists.',
      otp: null,
    }
  }

  try {
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    await sendEmail({
      to: validatedFields.data.email,
      subject: 'Your RevaDates Verification Code',
      html: `
        <div style="font-family: Arial, sans-serif; color: #333;">
          <h2>Welcome to RevaDates!</h2>
          <p>Your 4-digit verification code is:</p>
          <p style="font-size: 24px; font-weight: bold; letter-spacing: 2px;">${otp}</p>
          <p>This code will expire in 10 minutes.</p>
          <p>If you did not request this code, please ignore this email.</p>
        </div>
      `,
    });
    return { error: null, otp };
  } catch (e) {
    return { error: 'Failed to send verification email. Please try again.', otp: null };
  }
}

export async function handleSwipeAction(swiperId: string, swipedId: string, action: 'liked' | 'rejected') {
  if (!swiperId || !swipedId) {
    return { error: 'Invalid user IDs provided.' };
  }

  const supabase = createClient();
  const now = getISTTimestamp();

  const { error: swipeError } = await supabase.from('swipes').upsert(
    {
      swiper_id: swiperId,
      swiped_id: swipedId,
      action: action,
      created_at: now,
    },
    { onConflict: 'swiper_id,swiped_id' }
  );

  if (swipeError) {
    return { error: 'Could not record your swipe.' };
  }
  
  if (action === 'liked') {
    const { data: swiperProfile, error: swiperProfileError } = await supabase
      .from('profiles')
      .select('name, match_notification')
      .eq('id', swiperId)
      .single();

    if (swiperProfile) {
        await supabase.from('notifications').upsert(
            {
                recipient_id: swipedId,
                sender_id: swiperId,
                type: 'new_like',
                message: `${swiperProfile.name} liked your profile!`,
                created_at: now,
            },
            { onConflict: 'recipient_id,sender_id,type', ignoreDuplicates: false }
        );
    }


    const { data: mutualLike, error: checkError } = await supabase
      .from('swipes')
      .select('swiper_id') 
      .eq('swiper_id', swipedId)
      .eq('swiped_id', swiperId)
      .eq('action', 'liked')
      .single();

    if (checkError && checkError.code !== 'PGRST116') { // Ignore 'No rows found' error
      return { error: 'Could not check for a match.' };
    }
    
    if (mutualLike) {
        const { data: swipedProfile, error: swipedProfileError } = await supabase
            .from('profiles')
            .select('name, match_notification')
            .eq('id', swipedId)
            .single();
      
        const { error: matchError } = await supabase.from('matches').insert({
          user1_id: swiperId,
          user2_id: swipedId,
          created_at: now,
        });

        if (matchError && matchError.code !== '23505') {
          // Don't fail the whole operation, just log it. The match will be created if they both swipe.
        }

        const notificationTime = getISTTimestamp();
        // Create notifications for both users if their settings allow it
        if (swiperProfile?.match_notification) {
            await supabase.from('notifications').insert({
                recipient_id: swiperId,
                sender_id: swipedId,
                type: 'new_match',
                message: `You matched with ${swipedProfile?.name}!`,
                created_at: notificationTime,
            });
        }
        if (swipedProfile?.match_notification) {
            await supabase.from('notifications').insert({
                recipient_id: swipedId,
                sender_id: swiperId,
                type: 'new_match',
                message: `You matched with ${swiperProfile?.name}!`,
                created_at: notificationTime,
            });
        }
        
        revalidatePath('/chats');
        revalidatePath('/notifications');
        return { match: true };
    }
  }

  revalidatePath('/notifications');
  return { success: true };
}


export async function sendPasswordResetOtp(email: string) {
    const validatedFields = EmailSchema.safeParse({ email });
    if (!validatedFields.success) {
        return { error: 'Invalid email address.' };
    }

    const supabase = createClient();
    
    const { data: user, error: userError } = await supabase
        .from('profiles')
        .select('id, email')
        .eq('email', validatedFields.data.email)
        .single();
    
    if (userError || !user) {
        return { error: "No account found with that email address." };
    }

    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    const expires = getFutureISTTimestamp(10); // 10 minutes from now

    const { error: updateError } = await supabase
        .from('profiles')
        .update({
            password_reset_token: otp, 
            password_reset_token_expires_at: expires,
            updated_at: getISTTimestamp(),
        })
        .eq('id', user.id);

    if (updateError) {
        return { error: 'Could not create a reset code. Please try again.' };
    }

    try {
        await sendEmail({
            to: user.email,
            subject: 'Your RevaDates Password Reset Code',
            html: `
                <div style="font-family: Arial, sans-serif; color: #333;">
                  <h2>Password Reset Request</h2>
                  <p>Your 4-digit verification code is:</p>
                  <p style="font-size: 24px; font-weight: bold; letter-spacing: 2px;">${otp}</p>
                  <p>This code will expire in 10 minutes.</p>
                  <p>If you did not request this, please ignore this email.</p>
                </div>
            `,
        });
        return { success: true };
    } catch (e) {
        return { error: "Could not send the password reset code. Please try again later." };
    }
}

const PasswordResetSchema = z.object({
  email: z.string().email(),
  otp: z.string().length(4, 'OTP must be 4 digits.'),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
});

export async function resetPasswordWithOtp(email: string, otp: string, password: string) {
    const validatedFields = PasswordResetSchema.safeParse({ email, otp, password });
    if (!validatedFields.success) {
        const firstError = validatedFields.error.errors[0]?.message;
        return { error: firstError || 'Invalid input. Please try again.' };
    }

    const supabase = createClient();

    const { data: user, error: tokenError } = await supabase
        .from('profiles')
        .select('id, password_reset_token_expires_at')
        .eq('email', validatedFields.data.email)
        .eq('password_reset_token', validatedFields.data.otp)
        .single();

    if (tokenError || !user || !user.password_reset_token_expires_at) {
        return { error: 'Invalid or expired reset code.' };
    }

    const expires = new Date(user.password_reset_token_expires_at);
    if (expires < new Date()) {
        return { error: 'Invalid or expired reset code.' };
    }

    const { error: updateError } = await supabase
        .from('profiles')
        .update({
            password: password, // Passwords should be hashed!
            password_reset_token: null,
            password_reset_token_expires_at: null,
            updated_at: getISTTimestamp(),
        })
        .eq('id', user.id);

    if (updateError) {
        return { error: 'Could not update your password.' };
    }

    return { success: true };
}

export async function handleUndoSwipeAction(swiperId: string, swipedId: string) {
  if (!swiperId || !swipedId) {
    return { error: 'Invalid user IDs provided for undo.' };
  }

  const supabase = createClient();

  const { error } = await supabase
    .from('swipes')
    .delete()
    .eq('swiper_id', swiperId)
    .eq('swiped_id', swipedId);

  if (error) {
    return { error: 'Could not undo your last swipe.' };
  }

  return { success: true };
}

export async function getNotifications(userId: string) {
    if (!userId) return { data: [], error: 'User ID is required.' };
    const supabase = createClient();
    const { data, error } = await supabase
        .from('notifications')
        .select(`
            id,
            message,
            created_at,
            is_read,
            type,
            sender_id,
            sender:sender_id ( name, photos )
        `)
        .eq('recipient_id', userId)
        .order('created_at', { ascending: false });

    if (error) {
        return { data: [], error: 'Could not fetch notifications.' };
    }

    return { data, error: null };
}

export async function markNotificationsAsRead(userId: string) {
    if (!userId) return { error: 'User ID is required.' };
    const supabase = createClient();
    const now = getISTTimestamp();
    const { error } = await supabase
        .from('notifications')
        .update({ is_read: true, updated_at: now })
        .eq('recipient_id', userId)
        .eq('is_read', false);
    
    if (error) {
        return { error: 'Could not update notifications.' };
    }
    revalidatePath('/notifications');
    revalidatePath('/components/shared/app-header');
    return { success: true };
}

export async function blockUser(blockerId: string, blockedId: string) {
  if (!blockerId || !blockedId) {
    return { error: 'Invalid user IDs provided.' };
  }
  const supabase = createClient();

  const { error } = await supabase.rpc('append_to_blocked_users', {
      user_id: blockerId,
      blocked_id: blockedId
  });

  if (error) {
    return { error: 'Could not block the user.' };
  }

  await supabase.from('swipes').delete().or(`(swiper_id.eq.${blockerId},swiped_id.eq.${blockedId}),(swiper_id.eq.${blockedId},swiped_id.eq.${blockerId})`);
  await supabase.from('matches').delete().or(`(user1_id.eq.${blockerId},user2_id.eq.${blockedId}),(user1_id.eq.${blockedId},user2_id.eq.${blockerId})`);

  revalidatePath('/dashboard');
  return { success: true };
}

export async function getBlockedUsers(userId: string) {
  if (!userId) return { data: [], error: 'User ID is required.' };
  
  const supabase = createClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('blocked_users')
    .eq('id', userId)
    .single();

  if (error || !data || !data.blocked_users) {
    return { data: [], error: 'Could not fetch blocked users.' };
  }

  const blockedUserIds = data.blocked_users;

  if (blockedUserIds.length === 0) {
    return { data: [], error: null };
  }

  const { data: blockedProfiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, name, photos')
    .in('id', blockedUserIds);
  
  if (profilesError) {
    return { data: [], error: 'Could not fetch blocked user profiles.' };
  }

  return { data: blockedProfiles, error: null };
}

export async function unblockUser(blockerId: string, unblockedId: string) {
    if (!blockerId || !unblockedId) {
        return { error: 'Invalid user IDs provided.' };
    }
    const supabase = createClient();

    const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('blocked_users')
        .eq('id', blockerId)
        .single();
    
    if (fetchError || !data) {
        return { error: 'Could not find user profile.' };
    }

    const currentBlocked = data.blocked_users || [];
    const newBlocked = currentBlocked.filter(id => id !== unblockedId);

    const { error: updateError } = await supabase
        .from('profiles')
        .update({ blocked_users: newBlocked, updated_at: getISTTimestamp() })
        .eq('id', blockerId);

    if (updateError) {
        return { error: 'Could not unblock the user.' };
    }

    revalidatePath('/settings');
    return { success: true };
}

export async function getChatsAndMatches(userId: string) {
    if (!userId) return { chats: [], matches: [], error: 'User ID is required.' };
    const supabase = createClient();

    // Get all matches for the user
    const { data: allMatches, error: matchesError } = await supabase
        .from('matches')
        .select('id, user1_id, user2_id, created_at')
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
        .order('created_at', { ascending: false });

    if (matchesError) {
        return { chats: [], matches: [], error: 'Could not fetch your matches.' };
    }

    if (!allMatches || allMatches.length === 0) {
        return { chats: [], matches: [], error: null };
    }

    const matchIds = allMatches.map(m => m.id);

    // Get the latest message for each match
    const { data: lastMessages, error: messagesError } = await supabase
        .from('messages')
        .select(`
            match_id,
            content,
            created_at
        `)
        .in('match_id', matchIds)
        .order('created_at', { ascending: false });

    if (messagesError) {
        return { chats: [], matches: [], error: 'Could not fetch messages.' };
    }
    
    const lastMessageMap = new Map<string, { content: string; created_at: string }>();
    const seenMatchIds = new Set<string>();

    if (lastMessages) {
        for (const msg of lastMessages) {
            if (!seenMatchIds.has(msg.match_id)) {
                lastMessageMap.set(msg.match_id, { content: msg.content, created_at: msg.created_at });
                seenMatchIds.add(msg.match_id);
            }
        }
    }


    const chats = allMatches.filter(m => lastMessageMap.has(m.id));
    const newMatches = allMatches.filter(m => !lastMessageMap.has(m.id));

    const allMatchedUserIds = allMatches.map(m => (m.user1_id === userId ? m.user2_id : m.user1_id));
    const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name, photos')
        .in('id', allMatchedUserIds);

    if (profilesError) {
        return { chats: [], matches: [], error: 'Could not fetch profiles.' };
    }

    const profilesById = new Map(profiles.map(p => [p.id, p]));

    const formattedChats = chats.map(match => {
        const matchedUserId = match.user1_id === userId ? match.user2_id : match.user1_id;
        const matchedUser = profilesById.get(matchedUserId);
        const lastMessage = lastMessageMap.get(match.id);
        return {
            id: match.id,
            matchedUser: {
                id: matchedUser?.id,
                name: matchedUser?.name,
                photos: matchedUser?.photos,
            },
            lastMessage: lastMessage?.content || null,
            lastMessageTime: lastMessage?.created_at || null,
        };
    }).sort((a, b) => {
        if (!a.lastMessageTime) return 1;
        if (!b.lastMessageTime) return -1;
        return new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime();
    });

    const formattedMatches = newMatches.map(match => {
        const matchedUserId = match.user1_id === userId ? match.user2_id : match.user1_id;
        const matchedUser = profilesById.get(matchedUserId);
        return {
            id: match.id,
            matchedUser: {
                id: matchedUser?.id,
                name: matchedUser?.name,
                photos: matchedUser?.photos,
            }
        };
    });

    return { chats: formattedChats, matches: formattedMatches, error: null };
}

export async function updateUserProfile(userId: string, updates: Record<string, any>) {
    if (!userId) {
        return { error: 'User ID is required.' };
    }
    const supabase = createClient();
    const now = getISTTimestamp();

    const { error } = await supabase
        .from('profiles')
        .update({ ...updates, updated_at: now })
        .eq('id', userId);

    if (error) {
        return { error: 'Could not update your profile.' };
    }
    revalidatePath('/profile');
    revalidatePath('/dashboard');
    return { success: true };
}

export async function updateUserProfilePhotos(userId: string, photos: string[]) {
    if (!userId) {
        return { error: 'User ID is required.' };
    }
    const supabase = createClient();
    const now = getISTTimestamp();

    const { error } = await supabase
        .from('profiles')
        .update({ photos, updated_at: now })
        .eq('id', userId);

    if (error) {
        return { error: 'Could not update your photos.' };
    }
    revalidatePath('/profile');
    return { success: true };
}

export async function respondToLike(notificationId: string, recipientId: string, senderId: string, action: 'liked' | 'rejected') {
    if (!notificationId || !recipientId || !senderId) {
        return { error: 'Invalid IDs provided.' };
    }

    const supabase = createClient();
    const now = getISTTimestamp();
    
    // 1. Record the swipe from the recipient back to the original sender
    const { error: swipeError } = await supabase.from('swipes').upsert(
        {
            swiper_id: recipientId,
            swiped_id: senderId,
            action: action,
            created_at: now,
        },
        { onConflict: 'swiper_id,swiped_id' }
    );

    if (swipeError) {
        return { error: 'Could not record your response.' };
    }

    // 2. Delete the notification that has been actioned
    await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);
    
    // 3. If they liked back, check for a match and create one
    if (action === 'liked') {
         const { data: mutualLike, error: checkError } = await supabase
            .from('swipes')
            .select('swiper_id')
            .eq('swiper_id', senderId) // The original sender
            .eq('swiped_id', recipientId) // The current user
            .eq('action', 'liked')
            .single();

        if (checkError && checkError.code !== 'PGRST116') {
            return { error: 'Could not check for a match.' };
        }
        
        // If there is a mutual like, create the match record
        if (mutualLike) {
            const { error: matchError } = await supabase.from('matches').insert({
                user1_id: recipientId,
                user2_id: senderId,
                created_at: now,
            });

            if (matchError && matchError.code !== '23505') { // 23505 is unique violation
                return { error: 'Could not create the match record.' };
            }
            
            // Fetch profiles for notification messages
            const { data: profiles, error: profilesError } = await supabase
                .from('profiles')
                .select('id, name, match_notification')
                .in('id', [recipientId, senderId]);

            if (!profilesError && profiles) {
                const recipientProfile = profiles.find(p => p.id === recipientId);
                const senderProfile = profiles.find(p => p.id === senderId);

                // Notify the original sender about the new match
                if (senderProfile?.match_notification) {
                     await supabase.from('notifications').insert({
                        recipient_id: senderId,
                        sender_id: recipientId,
                        type: 'new_match',
                        message: `You matched with ${recipientProfile?.name}!`,
                        created_at: now,
                    });
                }
            }


            // Revalidate paths to update UI
            revalidatePath('/chats');
            revalidatePath('/notifications');
            return { match: true };
        }
    }

    revalidatePath('/notifications');
    return { success: true };
}

export async function getChatMessages(matchId: string) {
    if (!matchId) return { data: [], error: 'Match ID is required.' };
    const supabase = createClient();
    const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('match_id', matchId)
        .order('created_at', { ascending: true });

    if (error) {
        return { data: null, error: 'Could not fetch messages.' };
    }
    return { data, error: null };
}

export async function sendMessage(matchId: string, senderId: string, recipientId: string, content: string, tempId?: string) {
    if (!matchId || !senderId || !content) {
        return { data: null, error: 'Missing required fields to send message.' };
    }
    const supabase = createClient();
    const now = getISTTimestamp();
    
    const { data, error } = await supabase
        .from('messages')
        .insert({
            match_id: matchId,
            sender_id: senderId,
            recipient_id: recipientId,
            content: content,
            created_at: now,
        })
        .select()
        .single();

    if (error) {
        console.error('SendMessage Error:', error);
        return { data: null, error: 'Could not send the message.' };
    }

    // Add the tempId to the returned data so the client can find it.
    const returnedData = data ? { ...data, tempId: tempId } : null;

    revalidatePath(`/chats/${matchId}`);
    revalidatePath('/chats');
    return { data: returnedData, error: null };
}


export async function getMatchDetails(matchId: string, currentUserId: string) {
    if (!matchId) return { data: null, error: 'Match ID required' };
    const supabase = createClient();

    const { data: match, error: matchError } = await supabase
        .from('matches')
        .select('user1_id, user2_id')
        .eq('id', matchId)
        .single();

    if (matchError || !match) {
        return { data: null, error: 'Could not find match details.' };
    }

    const otherUserId = match.user1_id === currentUserId ? match.user2_id : match.user1_id;

    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, name, photos')
        .eq('id', otherUserId)
        .single();

    if (profileError || !profile) {
        return { data: null, error: 'Could not find matched user profile.' };
    }

    return { data: profile, error: null };
}

export async function markMessagesAsRead(matchId: string, userId: string) {
    if (!matchId || !userId) return { error: 'Match ID and User ID are required.' };
    const supabase = createClient();
    const { error } = await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('match_id', matchId)
        .eq('recipient_id', userId)
        .eq('is_read', false);

    if (error) {
        return { error: 'Could not mark messages as read.' };
    }
    revalidatePath(`/chats/${matchId}`);
    return { success: true };
}


export async function updateUserLocation(userId: string, lat: number, lon: number) {
    if (!userId) return { error: 'User ID is required.' };
    if (lat === undefined || lon === undefined) return { error: 'Latitude and Longitude are required.' };

    const supabase = createClient();
    const locationString = `POINT(${lon} ${lat})`;

    const { error } = await supabase
        .from('profiles')
        .update({ location: locationString, updated_at: getISTTimestamp() })
        .eq('id', userId);

    if (error) {
        return { error: 'Could not update your location.' };
    }

    return { success: true };
}
