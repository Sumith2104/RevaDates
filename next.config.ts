
require('dotenv').config();
import type {NextConfig} from 'next';

const supabaseHostname = 'babzgrswhtfxqqolfjpi.supabase.co';

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
      // Add Supabase storage domain
      {
        protocol: 'https',
        hostname: supabaseHostname,
        port: '',
        pathname: '/storage/v1/object/public/photos/**',
      },
    ],
  },
};

export default nextConfig;
