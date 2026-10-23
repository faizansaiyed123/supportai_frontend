# SupportAI - Frontend

Next.js 15 App Router frontend, packaged for production with its own Dockerfile and
`docker-compose.yml`.

The backend lives in a **separate repository** with its own Docker setup. Nothing here starts it.

## Quick start

The backend must be running first. From this directory:

```
API_URL=http://localhost:8000 docker compose up --build
```

Then open <http://localhost:3000>.

On Windows PowerShell:

```
$env:API_URL="http://localhost:8000"; docker compose up --build
```

`API_URL` is optional. It defaults to `http://localhost:8000/api`, which matches a backend on its
default port.

To use a different host port, set `FRONTEND_PORT`:

```
FRONTEND_PORT=3001 API_URL=http://localhost:8000 docker compose up --build
```

If you do, the backend must allow that origin. Restart the backend with the matching value, or
use the backend's `run.py --frontend-origin http://localhost:3001`. Authentication uses cookies, so
a CORS mismatch makes every API call from the browser fail.

## Local development without Docker

```
npm install
cp .env.example .env.local
npm run dev
```

Next.js dev server defaults to <http://localhost:3000>, which is the origin the backend allows by
default.

| Script | Purpose |
| --- | --- |
| `npm run dev` | Development server with hot reload |
| `npm run build` | Production build |
| `npm start` | Serve a production build (needs `output: "standalone"` handling, see Dockerfile) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | `eslint .` |
| `npm test` | Vitest unit tests |
| `npm run test:e2e` | Playwright end-to-end tests |

`npm run lint` needs an ESLint 9 flat config (`eslint.config.js`), which this repository does not
have yet. `npm run typecheck`, `npm test` and `npm run test:e2e` work.

## How the image is built

`Dockerfile` uses three stages on `node:22-alpine`:

1. **deps** - `npm ci`, so the image matches `package-lock.json` exactly, same as CI.
2. **builder** - `npm run build`. `next.config.ts` sets `output: "standalone"`, so this stage
   emits a self-contained server bundle with only the node_modules the app actually imports.
3. **runner** - copies `public/`, `.next/standalone` and `.next/static`, runs as the unprivileged
   `node` user (uid 1000), and starts `node server.js`.

Two details worth knowing:

- **`NEXT_PUBLIC_*` variables are inlined into the browser bundle at build time.** They are not read
  at runtime. `NEXT_PUBLIC_API_BASE_URL` is therefore passed as a build argument in
  `docker-compose.yml`, not only as a container environment variable. Change it and rebuild
  (`docker compose up --build`), otherwise the browser keeps calling the old URL.
- **`next build` fails on a missing `public/` directory in standalone mode.** The Dockerfile creates
  it rather than special-casing the copy.

## Configuration

| Variable | Default | Notes |
| --- | --- | --- |
| `API_URL` | `http://localhost:8000/api` | Passed as the `NEXT_PUBLIC_API_BASE_URL` build arg |
| `NEXT_PUBLIC_API_BASE_URL` | `http://localhost:8000/api` | Used directly by `npm run dev` outside Docker |
| `FRONTEND_PORT` | `3000` | Host port; must match the backend's `ALLOWED_ORIGINS` |

For host-side development the variable name is the Next.js one, `NEXT_PUBLIC_API_BASE_URL`, as in
`.env.example`.

## Production hardening

The image already runs the standalone Next server as an unprivileged user (`node`, uid 1000)
with `NODE_ENV=production` and `NEXT_TELEMETRY_DISABLED=1`. `next.config.ts` adds the security
response headers `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, and
`Strict-Transport-Security`. No `Content-Security-Policy` is added, because Next.js uses inline
scripts for font optimization and a restrictive CSP would need careful nonce/exclusion work.

In production, run the frontend behind a TLS-terminating reverse proxy and point it at the API
with the proxy-relative origin:

```
API_URL=https://supportai.example.com/api docker compose up --build
```

Because `NEXT_PUBLIC_API_BASE_URL` is baked into the bundle at build time, changing it always
requires `--build`.

## Useful commands

```
docker compose ps                   service status
docker compose logs -f frontend     follow logs
docker compose down                 stop
docker compose up --build           rebuild and restart
```