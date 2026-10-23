import type { NextConfig } from "next";
import { PRODUCT_IMAGE_MAX_BYTES } from "./lib/uploads/limits";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
// Local Supabase (`supabase start`) serves images from 127.0.0.1, which Next blocks by default.
const isLocalSupabase = supabaseUrl ? ["127.0.0.1", "localhost"].includes(new URL(supabaseUrl).hostname) : false;

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    dangerouslyAllowLocalIP: isLocalSupabase,
    // Product photos are served from this project's public storage bucket only.
    remotePatterns: supabaseUrl ? [new URL(`${supabaseUrl}/storage/v1/object/public/product-images/**`)] : [],
  },
  experimental: {
    serverActions: {
      // Room for one product image plus multipart overhead.
      bodySizeLimit: PRODUCT_IMAGE_MAX_BYTES + 256 * 1024,
    },
  },
};

export default nextConfig;
