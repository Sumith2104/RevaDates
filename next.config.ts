
require('dotenv').config();
import type {NextConfig} from 'next';

const supabaseHostname = 'babzgrswhtfxqqolfjpi.supabase.co';

const nextConfig: NextConfig = {
  
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
        hostname: supabaseHostname,
        port: '',
        pathname: '/storage/v1/object/public/photos/**',
      },
      {
        protocol: 'https',
        hostname: 'revadates.vercel.app',
      },
    ],
  },
};

export default nextConfig;
