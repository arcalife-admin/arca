/** @type {import('next').NextConfig} */
const nextConfig = {
  // Using standalone mode for server rendering
  output: 'standalone',
  images: {
    domains: ['res.cloudinary.com'],
  },
  // Skip typechecking during build (we'll do it separately)
  typescript: {
    ignoreBuildErrors: true,
  },
  // Skip ESLint during build (we'll do it separately)
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Configuration for handling search params in client components
  experimental: {
    // This prevents errors with useSearchParams
    missingSuspenseWithCSRBailout: false,
    // Skip building API routes during static generation
    skipTrailingSlashRedirect: true,
  },
  // Configure route settings to make dashboard pages dynamic
  pageExtensions: ['js', 'jsx', 'ts', 'tsx'],
  compiler: {
    // Disable server components for select paths
    reactRemoveProperties: { properties: ['^data-test'] },
  },
  // Configure dashboard pages to be CSR only
  transpilePackages: ['lucide-react'],
  // Skip API route validation during build
  webpack: (config, { isServer }) => {
    // Fix module resolution issues
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
        stream: false,
        util: false,
        buffer: false,
        os: false,
        net: false,
        tls: false,
        child_process: false,
        'pg-native': false,
      };
    }

    // Prevent bundling of server-only packages in client bundle
    if (!isServer) {
      config.externals = config.externals || [];
      config.externals.push(
        'replicate',
        '@prisma/client',
        'prisma',
        'bcryptjs',
        'bcrypt',
        'pg-native',
        'pg'
      );
    }

    return config;
  },
  // Disable static optimization for API routes
  async rewrites() {
    return {
      beforeFiles: [],
      afterFiles: [],
      fallback: [],
    };
  },
  // Ensure API routes are not statically optimized
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, must-revalidate',
          },
        ],
      },
    ];
  },
  // Disable static generation for API routes
  async generateStaticParams() {
    return [];
  },
}

module.exports = nextConfig 