
'use server';

import { z } from 'zod';
import { sendEmail } from './email';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { formatDistanceToNow } from 'date-fns';

const EmailSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address.' }),
});

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
    console.error('Failed to send email:', e);
    return { error: 'Failed to send verification email. Please try again.', otp: null };
  }
}

export async function handleSwipeAction(swiperId: string, swipedId: string, action: 'liked' | 'rejected') {
  if (!swiperId || !swipedId) {
    return { error: 'Invalid user IDs provided.' };
  }

  const supabase = createClient();

  // Upsert the swipe action to prevent unique constraint errors on re-swiping
  const { error: swipeError } = await supabase.from('swipes').upsert(
    {
      swiper_id: swiperId,
      swiped_id: swipedId,
      action: action,
    },
    { onConflict: 'swiper_id,swiped_id' }
  );

  if (swipeError) {
    console.error('Error recording swipe:', swipeError);
    return { error: 'Could not record your swipe.' };
  }
  
  // If it was a 'like', create a notification
  if (action === 'liked') {
    const { data: swiperProfile, error: swiperProfileError } = await supabase
      .from('profiles')
      .select('name, match_notification')
      .eq('id', swiperId)
      .single();

    if (swiperProfileError) {
      console.error('Error fetching swiper profile:', swiperProfileError);
    }

    if (swiperProfile) {
        // Upsert logic for 'new_like' notifications to avoid duplicates
        const { error: notificationError } = await supabase.from('notifications').upsert({
            recipient_id: swipedId,
            sender_id: swiperId,
            type: 'new_like',
            message: `${swiperProfile.name} liked your profile!`,
        }, {
            onConflict: 'recipient_id,sender_id,type',
            // Update the created_at timestamp on conflict to make it "new" again
            ignoreDuplicates: false,
        });

        if (notificationError) {
            console.error('Error creating notification:', notificationError);
        }
    }


    // Check for a mutual like (match)
    const { data: mutualLike, error: checkError } = await supabase
      .from('swipes')
      .select('swiper_id') // just need to check for existence
      .eq('swiper_id', swipedId) // The other person
      .eq('swiped_id', swiperId) // You
      .eq('action', 'liked')
      .single();

    if (checkError && checkError.code !== 'PGRST116') { // Ignore 'No rows found' error
      console.error('Error checking for mutual like:', checkError);
      return { error: 'Could not check for a match.' };
    }
    
    if (mutualLike) {
        const { data: swipedProfile, error: swipedProfileError } = await supabase
            .from('profiles')
            .select('name, match_notification')
            .eq('id', swipedId)
            .single();

        if (swipedProfileError) {
            console.error('Error fetching swiped profile for match notification:', swipedProfileError);
        }
      
        // It's a match! Check if match already exists
        const { data: existingMatch, error: matchCheckError } = await supabase
            .from('matches')
            .select('id')
            .or(`(user1_id.eq.${swiperId},user2_id.eq.${swipedId}),(user1_id.eq.${swipedId},user2_id.eq.${swiperId})`)
            .limit(1);

        if (matchCheckError && matchCheckError.code !== 'PGRST116') {
            console.error('Error checking for existing match:', matchCheckError);
            return { error: 'Could not check for existing match.' };
        }
      
        if (!existingMatch || existingMatch.length === 0) {
            const { error: matchError } = await supabase.from('matches').insert({
            user1_id: swiperId,
            user2_id: swipedId,
            });

            if (matchError) {
            console.error('Error creating match:', matchError);
            return { error: 'Could not create the match.' };
            }

            // Create notifications for both users if their settings allow it
            if (swiperProfile?.match_notification) {
                await supabase.from('notifications').insert({
                    recipient_id: swiperId,
                    sender_id: swipedId,
                    type: 'new_match',
                    message: `You matched with ${swipedProfile?.name}!`,
                });
            }
            if (swipedProfile?.match_notification) {
                await supabase.from('notifications').insert({
                    recipient_id: swipedId,
                    sender_id: swiperId,
                    type: 'new_match',
                    message: `You matched with ${swiperProfile?.name}!`,
                });
            }
            
            revalidatePath('/chats');
            revalidatePath('/notifications');
            revalidatePath('/components/shared/app-header');
            return { match: true };
        }
    }
  }

  revalidatePath('/notifications');
  revalidatePath('/components/shared/app-header');
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
    const expires = new Date(new Date().getTime() + 600 * 1000); // 10 minutes from now

    // Use service role client to bypass RLS for this trusted server operation
    const { error: updateError } = await supabase
        .from('profiles')
        .update({
            password_reset_token: otp, // Storing OTP in the token column
            password_reset_token_expires_at: expires.toISOString(),
        })
        .eq('id', user.id);

    if (updateError) {
        console.error("Error storing password reset OTP:", updateError);
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
        console.error("Failed to send password reset email:", e);
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

    if (tokenError || !user) {
        return { error: 'Invalid or expired reset code.' };
    }

    const expires = new Date(user.password_reset_token_expires_at);
    if (expires < new Date()) {
        return { error: 'Invalid or expired reset code.' };
    }

    const { error: updateError } = await supabase
        .from('profiles')
        .update({
            password: validatedFields.data.password, // Passwords should be hashed!
            password_reset_token: null,
            password_reset_token_expires_at: null,
        })
        .eq('id', user.id);

    if (updateError) {
        console.error("Error updating password:", updateError);
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
    console.error('Error undoing swipe:', error);
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
            sender:sender_id ( name, photos )
        `)
        .eq('recipient_id', userId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Error fetching notifications:", error);
        return { data: [], error: 'Could not fetch notifications.' };
    }
    return { data, error: null };
}

export async function markNotificationsAsRead(userId: string) {
    if (!userId) return { error: 'User ID is required.' };
    const supabase = createClient();
    const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('recipient_id', userId)
        .eq('is_read', false);
    
    if (error) {
        console.error("Error marking notifications as read:", error);
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

  // Atomically append the new blocked user's ID to the array
  const { error } = await supabase.rpc('append_to_blocked_users', {
      user_id: blockerId,
      blocked_id: blockedId
  });

  if (error) {
    console.error('Error blocking user:', error);
    return { error: 'Could not block the user.' };
  }

  // Also remove any existing swipe history between them
  await supabase.from('swipes').delete().or(`(swiper_id.eq.${blockerId},swiped_id.eq.${blockedId}),(swiper_id.eq.${blockedId},swiped_id.eq.${blockerId})`);
  
  // And any existing match
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

    // Fetch current blocked users
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
        .update({ blocked_users: newBlocked })
        .eq('id', blockerId);

    if (updateError) {
        console.error('Error unblocking user:', updateError);
        return { error: 'Could not unblock the user.' };
    }

    revalidatePath('/settings');
    return { success: true };
}

export async function getMatches(userId: string) {
    if (!userId) return { data: [], error: 'User ID is required.' };
    const supabase = createClient();

    const { data, error } = await supabase
        .rpc('get_matches_without_messages', { current_user_id: userId });

    if (error) {
        console.error('Error fetching matches:', error);
        return { data: [], error: 'Could not fetch your matches.' };
    }
    
    const formattedMatches = data.map((match: any) => ({
        id: match.id,
        matchedUser: {
          id: match.matched_user_id,
          name: match.matched_user_name,
          photos: match.matched_user_photos,
        }
    }));
    
    return { data: formattedMatches, error: null };
}

export async function getChats(userId: string) {
    if (!userId) return { data: [], error: 'User ID is required.' };
    const supabase = createClient();

    const { data, error } = await supabase
        .rpc('get_matches_with_messages', { current_user_id: userId });

    if (error) {
        console.error('Error fetching chats:', error);
        return { data: [], error: 'Could not fetch your chats.' };
    }
    
    const formattedChats = data.map((chat: any) => ({
        id: chat.id,
        matchedUser: {
            id: chat.matched_user_id,
            name: chat.matched_user_name,
            photos: chat.matched_user_photos,
        },
        lastMessage: chat.last_message_content,
        lastMessageTime: formatDistanceToNow(new Date(chat.last_message_created_at), { addSuffix: true }),
    }));
    
    return { data: formattedChats, error: null };
}

export async function updateUserProfilePhotos(userId: string, photos: string[]) {
    if (!userId) {
        return { error: 'User ID is required.' };
    }
    const supabase = createClient();

    const { error } = await supabase
        .from('profiles')
        .update({ photos })
        .eq('id', userId);

    if (error) {
        console.error('Error updating user photos:', error);
        return false;
    }
    revalidatePath('/profile');
    return true;
}
