
import { createClient as createServerClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

export function createClient() {
  // While we are not using Supabase Auth, the server client can still be created.
  // This setup is simple as we are not passing cookies for auth.
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
