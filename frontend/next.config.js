/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    domains: ["preprod.css.cloud.ms2tech.fr", "css.cloud.ms2tech.fr", "localhost"],
    unoptimized: true,
  },
  env: {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    API_BASE_URL: process.env.API_BASE_URL || "https://preprod.css.cloud.ms2tech.fr/api/v1",
  },
  webpack: (config, { isServer }) => {
    // Exclude canvas module from bundling (Konva uses it only on server, not in browser)
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        canvas: false,
        fs: false,
      };
    }
    
    // Use externals for server-side to prevent canvas from being bundled
    if (isServer) {
      config.externals = [...(config.externals || []), { canvas: 'canvas' }];
    }
    
    return config;
  },
}

module.exports = nextConfig
