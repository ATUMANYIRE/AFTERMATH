/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/experiments',
        destination: '/time-machine',
      },
      {
        source: '/experiments/:id',
        destination: '/time-machine?experiment=:id',
      },
    ];
  },
};

export default nextConfig;

