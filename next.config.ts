import type { NextConfig } from "next";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const remotePatterns: NonNullable<NextConfig["images"]>["remotePatterns"] = [];

if (supabaseUrl) {
  const parsedUrl = new URL(supabaseUrl);

  remotePatterns.push({
    hostname: parsedUrl.hostname,
    pathname: "/storage/v1/object/**",
    port: parsedUrl.port || "",
    protocol: parsedUrl.protocol.replace(":", "") as "http" | "https",
  });
}

const nextConfig: NextConfig = {
  images: {
    remotePatterns,
  },
  reactStrictMode: true,
};

export default nextConfig;
