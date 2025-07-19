
require('dotenv').config();
import type {NextConfig} from 'next';

// This is a workaround to ensure the env variables are loaded for the config
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://babzgrswhtfxqqolfjpi.supabase.co";
let supabaseHostname = '';
if (supabaseUrl) {
  try {
    supabaseHostname = new URL(supabaseUrl).hostname;
  } catch (e) {
    console.error('Invalid NEXT_PUBLIC_SUPABASE_URL:', e);
  }
}

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      // Add Supabase storage domain only if the URL is set and valid
      ...(supabaseHostname ? [{
        protocol: 'https' as const,
        hostname: supabaseHostname,
        port: '',
        pathname: '/storage/v1/object/public/**',
      }] : []),
    ],
  },
};

export default nextConfig;
