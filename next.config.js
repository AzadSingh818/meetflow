/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'firebasestorage.googleapis.com' },
      { protocol: 'https', hostname: '*.supabase.co' },
    ],
  },

  experimental: {
    serverComponentsExternalPackages: ['mongoose', 'bcrypt'],
  },
};

module.exports = nextConfig;