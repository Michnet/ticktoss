/** @type {import('next').NextConfig} */
const nextConfig = {
   allowedDevOrigins: ['10.113.48.91'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lyvecityclub.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'wordpress-t4gsk408cksoog8g008o8sgc.afyapals.com',
        pathname: '/**',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/javascript; charset=utf-8',
          },
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
