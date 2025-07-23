
import { createClient } from '@/lib/supabase/server';
import { toZonedTime, format } from 'date-fns-tz';
import { NextResponse } from 'next/server';

const timeZone = 'Asia/Kolkata';

function getISTTimestamp() {
    const now = new Date();
    const zonedDate = toZonedTime(now, timeZone);
    return format(zonedDate, "yyyy-MM-dd'T'HH:mm:ss.SSSXXX", { timeZone });
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';

  if (code) {
    const supabase = createClient();
    const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && session?.user) {
      const user = session.user;
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single();
        
      if (!profile) {
        const now = getISTTimestamp();
        const { error: insertError } = await supabase.from('profiles').insert({
          id: user.id,
          email: user.email,
          name: user.user_metadata.full_name || user.user_metadata.name || 'New User',
          photos: user.user_metadata.avatar_url ? [user.user_metadata.avatar_url] : [],
          created_at: now,
          updated_at: now,
        });

        if (insertError) {
          console.error("Error creating profile for Google user:", insertError);
          return NextResponse.redirect(`${origin}/?error=Could not create your profile. Please try again.`);
        }
      }
      
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  console.error("Error in auth callback:", "No code or session error");
  return NextResponse.redirect(`${origin}/?error=Authentication failed. Please try again.`);
}
