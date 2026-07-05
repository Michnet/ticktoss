/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'wqxvlrejlpkvqzwrqptr.supabase.co',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'wordpress-t4gsk408cksoog8g008o8sgc.afyapals.com',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
