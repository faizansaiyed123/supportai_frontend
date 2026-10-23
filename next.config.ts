import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Emits a self-contained server bundle in .next/standalone (plus only the node_modules the app
  // actually imports). The production Dockerfile's runner stage copies that instead of the full
  // tree. This does not change `next dev` or a plain `next start`, and the host-side dev workflow
  // (python run.py -> npm run dev) is unaffected.
  output: "standalone",
  // API base URL is read client-side from NEXT_PUBLIC_API_BASE_URL (see .env.example) -
  // no rewrite/proxy here by default since the backend already sets permissive CORS with
  // credentials for the configured ALLOWED_ORIGINS (backend/app/core/config.py). A reverse
  // proxy setup is a reasonable production hardening step (avoids exposing the API's exact
  // origin to the browser) but isn't required for this to function.
  // Production hardening headers. A Next build reads process.env at build time, so these are
  // applied to every response the server emits. HSTS is harmless over plain HTTP (browsers ignore
  // it) and protects once behind a TLS-terminating reverse proxy. No Content-Security-Policy is
  // added here: Next.js uses inline scripts for font optimization and similar, so a restrictive
  // CSP would break the build without careful nonce/exclusion configuration.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "no-referrer" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
        ],
      },
    ];
  },
};

export default nextConfig;
