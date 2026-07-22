# AGENTS.md — @ahoo-wang/fetcher-cosec

<!-- This file provides coding agents with context about this package. -->

## Build & Run Commands

```bash
# Build this package
pnpm --filter @ahoo-wang/fetcher-cosec build

# Run tests
pnpm --filter @ahoo-wang/fetcher-cosec test

# Run a single test file
pnpm --filter @ahoo-wang/fetcher-cosec vitest run test/cosecConfigurer.test.ts

# Lint
pnpm --filter @ahoo-wang/fetcher-cosec lint

# Clean
pnpm --filter @ahoo-wang/fetcher-cosec clean
```

## Testing

- Vitest with `globals: true` and `@vitest/coverage-v8`
- Test files: `*.test.ts` in a `test/` directory at the package root (mirroring `src/`)
- Run with `--coverage` flag by default

## Project Structure

```
src/
  cosecConfigurer.ts                        — Main configuration entry point
  cosecRequestInterceptor.ts                — Core CoSec request interceptor
  authorizationRequestInterceptor.ts        — Adds Authorization header to requests
  authorizationResponseInterceptor.ts       — Handles 401/403 responses
  unauthorizedErrorInterceptor.ts           — 401 Unauthorized error handling
  forbiddenErrorInterceptor.ts              — 403 Forbidden error handling
  tokenRefresher.ts                         — Token refresh logic
  tokenStorage.ts                           — Token storage abstraction
  jwtToken.ts                               — JWT token parsing and validation
  jwtTokenManager.ts                        — JWT token lifecycle management
  jwts.ts                                   — JWT utility functions
  deviceIdStorage.ts                        — Device ID generation and storage
  idGenerator.ts                            — Unique ID generation
  spaceIdProvider.ts                        — Multi-tenant space ID provider
  resourceAttributionRequestInterceptor.ts  — Resource attribution interceptor
  types.ts                                  — Type definitions
  index.ts                                  — Barrel export
  stories/                                  — Storybook stories
```

### Key Concepts

- **CoSecConfigurer**: Main entry point that wires up all interceptors onto a Fetcher instance
- **JWT Token Management**: Parse, validate, refresh, and store JWT tokens
- **Authorization Interceptors**: Automatically attach Bearer tokens to requests
- **Error Handling**: 401 triggers token refresh + retry; 403 is surfaced as ForbiddenError
- **Device ID**: Persistent device identification for security tracking
- **Multi-tenant**: Space ID provider for tenant-scoped authentication

## Dependencies

- `@ahoo-wang/fetcher` — core HTTP client
- `@ahoo-wang/fetcher-eventbus` — for auth state change events
- `@ahoo-wang/fetcher-storage` — for token and device ID persistence

## Code Style

- TypeScript strict mode
- Apache 2.0 license headers
- Prettier: single quotes, trailing commas, semicolons, 80 char width

## Git Workflow

- Conventional commits: `feat(cosec):`, `fix(cosec):`, `test(cosec):`
- Version synced via `pnpm update-version`

## Boundaries

- ✅ Adding new interceptor types for auth flows
- ✅ Adding new token storage strategies
- ✅ Writing new tests
- ⚠️ Changing token refresh logic — affects all authenticated API calls
- ⚠️ Modifying JWT parsing — security-sensitive, test thoroughly
- 🚫 Breaking CoSecConfigurer API
- 🚫 Changing 401/403 error handling contract — used by react RouteGuard
- 🚫 Removing token refresh retry logic without replacement
