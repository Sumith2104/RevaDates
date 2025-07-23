
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';

  if (code) {
    const supabase = createClient();
    const { error: exchangeError, data: sessionData } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      console.error('Error exchanging code for session:', exchangeError);
      return NextResponse.redirect(`${origin}/auth/auth-code-error`);
    }

    const user = sessionData?.user;

    if (user) {
      // Check if user exists in our public.profiles table
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single();
        
      // If profile doesn't exist, create one. This is for new users signing up with Google.
      if (!profile && !profileError) {
        const { data: newUser, error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            email: user.email,
            name: user.user_metadata.full_name,
            photos: user.user_metadata.avatar_url ? [user.user_metadata.avatar_url] : [],
            // You might want to have a separate onboarding step for DOB, gender, etc.
            // For now, we'll leave them as null or default.
          })
          .select()
          .single();

        if (insertError) {
          console.error('Error creating profile for new Google user:', insertError);
          // Handle failed profile creation
          return NextResponse.redirect(`${origin}/auth/auth-code-error`);
        }
      } else if (profileError && profileError.code !== 'PGRST116') { // PGRST116 is "No rows found"
        console.error('Error fetching profile:', profileError);
        return NextResponse.redirect(`${origin}/auth/auth-code-error`);
      }

      // User exists or has been created. Redirect to the dashboard.
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Fallback redirect
  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}
