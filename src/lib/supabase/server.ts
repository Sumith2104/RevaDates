
import { createClient as createServerClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Supabase URL and Service Role Key are required. Please check your .env file.');
}


export function createClient() {
  // While we are not using Supabase Auth, the server client can still be created.
  // This setup is simple as we are not passing cookies for auth.
  return createServerClient(
    supabaseUrl,
    supabaseServiceKey
  );
}
