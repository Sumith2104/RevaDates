
import { createClient as createServerClient } from '@supabase/supabase-js';

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase URL and Service Role Key are required. Please check your .env file.');
  }

  // While we are not using Supabase Auth, the server client can still be created.
  // This setup is simple as we are not passing cookies for auth.
  return createServerClient(
    supabaseUrl,
    supabaseServiceKey,
    {
        auth: {
            // Not using Supabase Auth, so we can bypass RLS for server-side actions
            // by using the service_role key.
            persistSession: false,
            autoRefreshToken: false,
        }
    }
  );
}
