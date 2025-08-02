/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: "/interactiveslides",
  output: "export",
  trailingSlash: true,
  images: {
    unoptimized: true,
    formats: ["image/avif", "image/webp"],
  },
};

module.exports = nextConfig;
