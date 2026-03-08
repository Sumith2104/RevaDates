const fs = require('fs');

const file1 = `
'use server';

import { z } from 'zod';
import { sendEmail } from './email';
import pool from '@/lib/fluxbase/server';
import { revalidatePath } from 'next/cache';
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
    const greeting = name ? \`<p>Hi \${name},</p>\` : '';
    return \`<!DOCTYPE html><html lang="en"><body><p>\${greeting} \${body} \${code}</p></body></html>\`;
}

// ACTION: loginUser
export async function loginUser(email: string, password?: string) {
    if (!email || !password) return { error: 'Email and password required' };
    const [rows]: any = await pool.query('SELECT id, name FROM profiles WHERE email = ? AND password = ? LIMIT 1', [email, password]);
    if (rows.length === 0) return { error: 'Invalid credentials' };
    return { data: rows[0] };
}

// ACTION: checkEmailExists
export async function checkEmailExists(email: string) {
    const [rows]: any = await pool.query('SELECT id FROM profiles WHERE email = ? LIMIT 1', [email]);
    if (rows.length === 0) return { error: 'No Account Found' };
    return { data: rows[0] };
}

export async function createUser(userData: Record<string, any>) {
  const now = getISTTimestamp();
  const id = uuidv4();
  
  try {
      await pool.query(
        'INSERT INTO profiles (id, name, email, password, dob, gender, discovery_gender_preference, bio, photos, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [id, \`\${userData.firstName} \${userData.lastName}\`, userData.email, userData.password, \`\${userData.dobYear}-\${userData.dobMonth}-\${userData.dobDay}\`, userData.gender, userData.genderPreference, "", JSON.stringify([]), now, now]
      );
      return { data: { id } };
  } catch (err: any) {
      return { data: null, error: err.message };
  }
}

export async function sendOtpEmail(email: string, firstName: string) {
  const validatedFields = EmailSchema.safeParse({ email });
  if (!validatedFields.success) return { error: 'Invalid email address provided.', otp: null };
  
  const [rows]: any = await pool.query('SELECT id FROM profiles WHERE email = ? LIMIT 1', [validatedFields.data.email]);
  if(rows.length > 0) return { error: 'An account with this email already exists.', otp: null };

  try {
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    const emailHtml = createModernEmailTemplate({
        title: 'Your RevaDates Verification Code',
        preheader: \`Your verification code is \${otp}\`,
        body: 'Welcome to RevaDates! To finish setting up your account, please use the following verification code:',
        code: otp,
        name: firstName,
    });
    await sendEmail({ to: validatedFields.data.email, subject: 'Your RevaDates Verification Code', html: emailHtml });
    return { error: null, otp };
  } catch (e) {
    return { error: 'Failed to send verification email. Please try again.', otp: null };
  }
}
\`;

fs.writeFileSync('C:\\\\Users\\\\sumit\\\\Downloads\\\\RevaDates\\\\src\\\\lib\\\\actions.ts', file1);
console.log('actions.ts rewritten successfully.');
