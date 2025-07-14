
'use server';

import { z } from 'zod';
import { sendEmail } from './email';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { v4 as uuidv4 } from 'uuid';

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

  // Record the swipe action
  const { error: swipeError } = await supabase.from('swipes').insert({
    swiper_id: swiperId,
    swiped_id: swipedId,
    action,
  });

  if (swipeError) {
    console.error('Error recording swipe:', swipeError);
    return { error: 'Could not record your swipe.' };
  }

  // If it was a 'like', check for a mutual like
  if (action === 'liked') {
    const { data: mutualLike, error: checkError } = await supabase
      .from('swipes')
      .select('id')
      .eq('swiper_id', swipedId) // The other person
      .eq('swiped_id', swiperId) // You
      .eq('action', 'liked')
      .single();

    if (checkError && checkError.code !== 'PGRST116') { // Ignore 'No rows found' error
      console.error('Error checking for mutual like:', checkError);
      return { error: 'Could not check for a match.' };
    }
    
    if (mutualLike) {
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

      // If no existing match, create one.
      if (!existingMatch || existingMatch.length === 0) {
        const { error: matchError } = await supabase.from('matches').insert({
          user1_id: swiperId,
          user2_id: swipedId,
        });

        if (matchError) {
          console.error('Error creating match:', matchError);
          return { error: 'Could not create the match.' };
        }
        revalidatePath('/chats');
        return { match: true };
      }
    }
  }

  return { success: true };
}


export async function sendPasswordResetEmail(email: string) {
    const validatedFields = EmailSchema.safeParse({ email });
    if (!validatedFields.success) {
        return { error: 'Invalid email address.' };
    }

    const supabase = createClient();
    
    // 1. Check if user exists
    const { data: user, error: userError } = await supabase
        .from('profiles')
        .select('id, email')
        .eq('email', validatedFields.data.email)
        .single();
    
    // Don't reveal if user exists or not for security, just return success
    if (userError || !user) {
        console.log(`Password reset requested for non-existent user: ${email}`);
        return { success: true };
    }

    // 2. Generate and store reset token
    const token = uuidv4();
    const expires = new Date(new Date().getTime() + 3600 * 1000); // 1 hour from now

    const { error: updateError } = await supabase
        .from('profiles')
        .update({
            password_reset_token: token,
            password_reset_token_expires_at: expires.toISOString(),
        })
        .eq('id', user.id);

    if (updateError) {
        console.error("Error storing password reset token:", updateError);
        return { error: 'Could not create a reset token. Please try again.' };
    }

    // 3. Send email
    const resetLink = `${process.env.NEXT_PUBLIC_BASE_URL}/reset-password?token=${token}`;
    try {
        await sendEmail({
            to: user.email,
            subject: 'Reset Your RevaDates Password',
            html: `
                <div style="font-family: Arial, sans-serif; color: #333;">
                  <h2>Password Reset Request</h2>
                  <p>We received a request to reset your password. Click the link below to set a new one:</p>
                  <p><a href="${resetLink}" style="color: #007bff; text-decoration: none;">Reset Your Password</a></p>
                  <p>This link will expire in 1 hour.</p>
                  <p>If you did not request this, please ignore this email.</p>
                </div>
            `,
        });
        return { success: true };
    } catch (e) {
        console.error("Failed to send password reset email:", e);
        return { error: "Could not send the password reset email. Please try again later." };
    }
}

const PasswordResetSchema = z.object({
  token: z.string().uuid(),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
});

export async function resetPassword(token: string, password: string) {
    const validatedFields = PasswordResetSchema.safeParse({ token, password });
    if (!validatedFields.success) {
        return { error: 'Invalid request. Please try again.' };
    }

    const supabase = createClient();

    // 1. Find user by token and check expiry
    const { data: user, error: tokenError } = await supabase
        .from('profiles')
        .select('id, password_reset_token_expires_at')
        .eq('password_reset_token', validatedFields.data.token)
        .single();

    if (tokenError || !user) {
        return { error: 'Invalid or expired reset token.' };
    }

    const expires = new Date(user.password_reset_token_expires_at);
    if (expires < new Date()) {
        return { error: 'Invalid or expired reset token.' };
    }

    // 2. Update password and clear token
    const { error: updateError } = await supabase
        .from('profiles')
        .update({
            password: validatedFields.data.password, // Remember to HASH passwords in a real app!
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
