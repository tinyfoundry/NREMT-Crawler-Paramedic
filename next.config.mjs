import withPWA from 'next-pwa';

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  turbopack: {},
  // CRITICAL FIX: Explicitly disable Turbopack for build to support PWA
  // The error message requested an empty config, but passing the flag in package.json is safer.
  // We keep this standard.
};

export default withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  // Fix for Next 16 App Dir
  buildExcludes: [/middleware-manifest.json$/], 
})(nextConfig);
