import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  // فتح الموقع من جهاز تاني على نفس الشبكة وقت التطوير (من غيرها الزراير مش بتشتغل)
  allowedDevOrigins: ["192.168.0.201", "192.168.*.*"],
  images: {
    // صور مؤقتة من Unsplash لحد تصوير المنتجات، وبعدها Supabase Storage
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "*.supabase.co", pathname: "/storage/v1/object/public/**" },
    ],
  },
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
