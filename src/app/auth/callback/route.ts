
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
      
      // Check if a profile for this user already exists
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single();
        
      // If no profile exists, create one
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
          // Redirect with an error message if profile creation fails
          return NextResponse.redirect(`${origin}/?error=Could not create your profile. Please try again.`);
        }
      }
      
      // Redirect to the dashboard (or the 'next' URL) after ensuring a profile exists
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Redirect to an error page if something went wrong
  console.error("Error in auth callback:", "No code or session error");
  return NextResponse.redirect(`${origin}/?error=Authentication failed. Please try again.`);
}
