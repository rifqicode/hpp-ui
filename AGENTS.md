# HPP frontend instructions

Applies to this React/TypeScript application. Adapted from this directory's
`GEMINI.md`; verify actual versions and scripts in `package.json` and the lockfile.

## Architecture

- Preserve the feature-based layout: `src/features/<feature>/{types,services,hooks}`,
  shared components/hooks, `src/pages/`, `src/lib/`, and the existing client store.
- Pages are presentation views. Consume data, loading/error flags, and handlers
  from hooks. Never call Axios, `apiClient`, or feature services directly in pages.
- Feature hooks own data fetching, mutation orchestration, loading/error state,
  and feedback. Reuse existing query/cache patterns in the touched feature.
- Services are async HTTP functions without React state. Use the shared
  `src/lib/api-client.ts`; do not create parallel clients or duplicate interceptors.
- Inspect the shared client's actual return types and response handling before
  consuming endpoints. Preserve token and active-store header behavior, response
  unwrapping, and authentication error handling.
- Define entity, request, and response types in the feature's types module.
  Avoid unchecked `any`; narrow unknown errors before accessing their properties.

## State and UI behavior

- Derive URL-backed tabs and filters from search parameters. Do not mirror them
  into state via an effect. Preserve unrelated query parameters on updates.
- Render dynamic tabs from configuration and use layouts that fit their actual
  count; avoid fixed column counts that become incorrect as tabs change.
- Use `cn` from `@/lib/utils` for conditional class merging and reuse the existing
  UI primitives and visual conventions.
- Follow the feature's existing user-facing language. Do not translate unrelated
  product copy as part of a technical change.
- Preserve store/permission-aware navigation and actions. Check API contracts
  when changing request payloads, decimal values, or response handling.
- For changed interactions, cover loading, empty, error, disabled, and success
  states as applicable. Verify keyboard access, visible focus, labels, and mobile
  overflow. Retain the existing design direction unless a redesign is requested.

## Verification

- For frontend code changes run `npm run build` (TypeScript plus Vite) and
  `npm run lint` from this directory. Separate existing failures from new failures.
- Run relevant `npm test` coverage for changed logic. When test TypeScript changes,
  also run `npm run test:typecheck`. Use the existing legacy/E2E scripts when the
  changed behavior depends on them; inspect their prerequisites first.
- For UI interaction changes, use the available browser tooling to exercise the
  changed flow at desktop and mobile sizes. Report if browser checks could not run.
- Do not run broad formatting commands that rewrite unrelated files.
