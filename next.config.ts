import type { NextConfig } from "next";
const withSerwist = require("@serwist/next").default({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
  disable: false,
});

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

export default withSerwist(nextConfig);