// ESLint 9 (flat config) - the project ships ESLint 9 + eslint-config-next as devDependencies but
// never added a config file, so `npm run lint` failed with "no configuration found". This is the
// Next.js 15 flat-config entry point. Source is TypeScript; ESLint loads @typescript-eslint
// through eslint-config-next, so no extra parser config is needed here.
import next from "eslint-config-next";

export default [
  ...next,
  {
    ignores: ["node_modules", "out", ".next", "dist"],
  },
];
