# Integration tests

This workspace verifies built Fetcher packages against real HTTP services. It is
intentionally separate from deterministic package unit tests.

## What runs

The cases are split by whether they leave the machine.

| Project    | Location                  | Command                 | CI                                       |
| ---------- | ------------------------- | ----------------------- | ---------------------------------------- |
| `required` | `test/` (not `external/`) | `pnpm test:it`          | `integration-test.yml`, a required check |
| `external` | `test/external/`          | `pnpm test:it:external` | `integration-external.yml`, advisory     |

`test/external/` holds every case that reaches a host on the public internet:

- Core Fetcher and decorator requests against JSONPlaceholder
  (`jsonplaceholder.typicode.com`).
- OpenAI-compatible streaming and non-streaming calls against the provider in
  `FETCHER_LLM_BASE_URL`, when the LLM test variables are available.

A third-party timeout says nothing about this repository, so these cases do not
block merges or releases: the advisory workflow runs them on pull requests that
touch the packages they exercise, on every push to `main` and `5.x`, and daily.
A red advisory run is still worth a look. The deterministic behaviour of the
same packages is covered by their unit tests (MSW mocks).

A new case that needs only local resources goes under `test/`; one that talks
to a host outside the CI job goes under `test/external/`. There are currently
no `required` cases, so `pnpm test:it` passes with no test files.

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
pnpm test:it            # required cases
pnpm test:it:external   # public-internet cases
```

Run one test while diagnosing:

```bash
pnpm --dir integration-test vitest run test/external/fetcher/typicodeFetcher.test.ts
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
