import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Keep already-visited pages in the client router cache for 5 minutes, so going back to
    // a page is instant. Mutations call revalidatePath("/", "layout"), which purges this cache,
    // so the data can never be stale after an edit.
    staleTimes: { dynamic: 300, static: 300 },
  },
};

export default nextConfig;
