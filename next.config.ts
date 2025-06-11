
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  output: 'export', // Enable static HTML export
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
    ],
    unoptimized: true, // Required for static export if using next/image
  },
  experimental: {
    turbo: {
      rules: {},
    },
  },
  webpack: (config) => {
    return config;
  },
  // Remove the i18n block if present, as App Router handles i18n via directory structure for static export
  // and this block can cause issues or is ignored for 'output: export' with App Router.
  // i18n: {
  //   locales: ['en', 'vi'],
  //   defaultLocale: 'vi',
  // },
};

// Export as default for .ts files, or module.exports for .js/.mjs
// If you rename to next.config.mjs, you'd use: export default nextConfig;
// For .ts, this is fine. The import in src/app/page.tsx might need adjustment based on actual file type.
// Assuming next.config.ts, the previous import in page.tsx might need to be nextConfig from '../../next.config.js' or similar if transpiled.
// For simplicity if page.tsx is TS, direct import might work if module resolution is set up or just hardcode defaultLocale
export default nextConfig;
    