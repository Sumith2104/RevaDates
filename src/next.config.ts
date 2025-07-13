
import type {NextConfig} from 'next';
import { config } from 'dotenv';

config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

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
      {
        protocol: 'https',
        hostname: supabaseUrl ? new URL(supabaseUrl).hostname : '',
        port: '',
        pathname: '/storage/v1/object/public/photos/**',
      }
    ].filter(pattern => pattern.hostname), // Filter out patterns without a hostname
  },
};

export default nextConfig;
