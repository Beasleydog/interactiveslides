import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export", // Enable static exports for GitHub Pages
  basePath: "/aislides", // Replace with your actual repository name
  trailingSlash: true, // Recommended for static exports
  images: {
    unoptimized: true, // Required for static export
  },
};

export default nextConfig;
