'use server';

import { suggestProfileImprovements } from '@/ai/flows/suggest-profile-improvements';
import { z } from 'zod';
import { sendEmail } from './email';

const SuggestionSchema = z.object({
  profileDescription: z.string().min(20, {
    message: 'Profile description must be at least 20 characters long.',
  }),
});

export async function getProfileSuggestions(prevState: any, formData: FormData) {
  const validatedFields = SuggestionSchema.safeParse({
    profileDescription: formData.get('profileDescription'),
  });

  if (!validatedFields.success) {
    return {
      error: validatedFields.error.flatten().fieldErrors.profileDescription?.[0] || "Invalid input.",
    };
  }

  try {
    const result = await suggestProfileImprovements({
      profileDescription: validatedFields.data.profileDescription,
    });
    return { suggestion: result.improvedDescription };
  } catch (e) {
    return { error: 'Failed to get suggestions. Please try again.' };
  }
}

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
