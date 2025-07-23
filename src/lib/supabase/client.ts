
'use client';

import { createClient as createBrowserClient } from '@supabase/supabase-js';

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase URL and Anon Key are required. Please check your .env file.');
  }

  
  const getCallbackUrl = () => {
    let url =
      process?.env?.NEXT_PUBLIC_SITE_URL ?? 
      process?.env?.NEXT_PUBLIC_VERCEL_URL ?? 
      'http://localhost:9002/'; 
    
    
    url = url.includes('http') ? url : `https://${url}`;
    
    url = url.charAt(url.length - 1) === '/' ? url : `${url}/`;
    return `${url}auth/callback`;
  };

  return createBrowserClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      auth: {
        callbackUrl: getCallbackUrl()
      }
    }
  );
}
