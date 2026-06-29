import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "covers.openlibrary.org" },
      { protocol: "https", hostname: "assetss.worksinprogress.co" },
      { protocol: "https", hostname: "lede-admin.nautil.us" },
      { protocol: "https", hostname: "static.scientificamerican.com" },
      { protocol: "https", hostname: "monocle.com" },
      { protocol: "https", hostname: "www.google.com" },
    ],
  },
};

export default nextConfig;
