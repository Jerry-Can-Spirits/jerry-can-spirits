import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Optimize images for better performance
  images: {
    domains: ['cdn.sanity.io'],
    formats: ['image/webp', 'image/avif'],
  },
  
  // Enable build caching for better performance
  experimental: {
    webpackBuildWorker: true,
  },
  
  // Webpack optimizations to reduce cache size
  webpack: (config, { dev, isServer }) => {
    if (!dev && !isServer) {
      // Reduce bundle size in production
      config.optimization.splitChunks = {
        chunks: 'all',
        maxSize: 244000, // Keep chunks under 244KB
        cacheGroups: {
          default: false,
          vendors: false,
          vendor: {
            name: 'vendor',
            chunks: 'all',
            test: /node_modules/,
            maxSize: 244000,
          },
        },
      };
    }
    
    // Exclude cache directory from being processed
    config.watchOptions = {
      ignored: ['**/cache/**', '**/node_modules/**'],
    };
    
    return config;
  },
};

export default nextConfig;
