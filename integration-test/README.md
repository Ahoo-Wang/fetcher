# Integration tests

This workspace verifies built Fetcher packages against real HTTP services. It is
intentionally separate from deterministic package unit tests.

## What runs

- Core Fetcher and decorator requests against JSONPlaceholder.
- OpenAI-compatible streaming and non-streaming calls when LLM test variables
  are available.

The Wow client and generated-code cases moved with the Wow packages to the
[Wow repository](https://github.com/Ahoo-Wang/Wow/tree/main/typescript), where
they run against a Wow server built from the same commit.

## Prerequisites

- Install root dependencies.
- Build all packages before running tests.
- Allow outbound access for JSONPlaceholder tests.
- Provide LLM test variables only through the environment; never commit values.

## Test

From the repository root:

```bash
pnpm install --frozen-lockfile
pnpm build
pnpm test:it
```

Run one test while diagnosing:

```bash
pnpm --dir integration-test vitest run test/fetcher/typicodeFetcher.test.ts
```

## Optional LLM environment

- `FETCHER_LLM_BASE_URL`
- `FETCHER_LLM_API_KEY`
- `FETCHER_LLM_MODEL`

These tests contact the configured provider and may incur cost. Keep them out of
ordinary local runs unless live integration evidence is required.

## Failure diagnosis

1. Build first; unresolved workspace imports usually mean stale or missing
   package output.
2. Separate network/provider failures from package unit regressions.
3. Unset credential environment variables when finished.

[中文](./README.zh-CN.md)
