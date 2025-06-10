
import type {NextConfig} from 'next';

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
    ],
  },
  i18n: {
    locales: ['vi', 'en'],
    defaultLocale: 'vi',
    localeDetection: false, // Explicitly disable automatic locale detection
  },
  experimental: {
    turbo: {
      rules: {},
    },
  },
  webpack: (config) => {
    return config;
  },
};

// Export as default for .ts files, or module.exports for .js/.mjs
// If you rename to next.config.mjs, you'd use: export default nextConfig;
// For .ts, this is fine. The import in src/app/page.tsx might need adjustment based on actual file type.
// Assuming next.config.ts, the previous import in page.tsx might need to be nextConfig from '../../next.config.js' or similar if transpiled.
// For simplicity if page.tsx is TS, direct import might work if module resolution is set up or just hardcode defaultLocale
export default nextConfig;
    
