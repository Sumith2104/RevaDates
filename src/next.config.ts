
import type {NextConfig} from 'next';

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
      // Add Supabase storage domain only if the URL is set
      ...(supabaseUrl ? [{
        protocol: 'https' as const,
        hostname: new URL(supabaseUrl).hostname,
        port: '',
        pathname: '/storage/v1/object/public/photos/**',
      }] : []),
    ],
  },
};

export default nextConfig;
