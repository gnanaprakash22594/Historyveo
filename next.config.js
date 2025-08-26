/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove experimental.appDir for Next.js 14+
  images: {
    domains: ['img.youtube.com', 'i.ytimg.com'], // YouTube thumbnail domains
  },
  // Fix for Vercel deployment - handle Node.js modules in serverless
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Client-side: resolve Node.js modules to empty
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        url: false,
        zlib: false,
        http: false,
        https: false,
        assert: false,
        os: false,
        path: false,
        util: false,
        buffer: false,
        querystring: false,
        punycode: false,
        domain: false,
        dns: false,
        dgram: false,
        child_process: false,
        cluster: false,
        module: false,
        process: false,
      }
    }
    
    // Ensure proper module resolution
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': require('path').resolve(__dirname),
    }
    
    return config
  },
  // Disable TypeScript checking during build for now
  typescript: {
    ignoreBuildErrors: true,
  },
  // Disable ESLint during build for now
  eslint: {
    ignoreDuringBuilds: true,
  },
}

module.exports = nextConfig