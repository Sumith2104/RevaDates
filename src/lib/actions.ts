
'use server';

import { z } from 'zod';
import { sendEmail } from './email';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

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
  // This operation is performed by the logged-in user and should use their permissions.
  // Note: For this to work client-side, you'd need Supabase JWT auth.
  // Since we are in a server action, we are currently relying on the service_role key which bypasses RLS.
  // This is acceptable for a trusted backend.
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
      // The service role key is used here to bypass RLS since this is a system action.
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
