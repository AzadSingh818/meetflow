/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'firebasestorage.googleapis.com' },
      { protocol: 'https', hostname: '*.supabase.co' },
    ],
  },

  serverExternalPackages: ["mongoose", "bcrypt"],
};

module.exports = nextConfig;