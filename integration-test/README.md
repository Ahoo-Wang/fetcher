# Integration tests

This workspace verifies built Fetcher packages against real HTTP services. It is
intentionally separate from deterministic package unit tests.

## What runs

The cases are split by whether they leave the machine.

| Project    | Location                  | Command                 | CI                                       |
| ---------- | ------------------------- | ----------------------- | ---------------------------------------- |
| `required` | `test/` (not `external/`) | `pnpm test:it`          | `integration-test.yml`, a required check |
| `external` | `test/external/`          | `pnpm test:it:external` | `integration-external.yml`, advisory     |

`required` covers the core Fetcher and decorator requests (`test/fetcher/`,
`test/decorator/`) against a local JSONPlaceholder. Before the run,
`test/jsonplaceholder/globalSetup.ts` starts
[json-server](https://github.com/typicode/json-server) 0.17 on a free port the
way JSONPlaceholder itself runs: fake writes (`POST` answers 201 with a new id,
`PUT`/`PATCH` answer the replaced or merged post, `DELETE` answers `{}`, and
nothing changes for the next request), `?userId=` filtering and nested routes
such as `/users/1/posts`. The data in `test/jsonplaceholder/db.json` is a small
cut of the real dataset (users 1–2 and their posts, albums, todos, comments).
The server's address is published as `JSONPLACEHOLDER_BASE_URL`, which
`typicodeFetcher` reads; set the variable yourself and no server starts, so the
same suites can run against another host:

```bash
JSONPLACEHOLDER_BASE_URL=https://jsonplaceholder.typicode.com pnpm test:it
```

`test/external/` holds every case that reaches a host on the public internet:
OpenAI-compatible streaming and non-streaming calls against the provider in
`FETCHER_LLM_BASE_URL`, when the LLM test variables are available.

A third-party timeout says nothing about this repository, so these cases do not
block merges or releases: the advisory workflow runs them on pull requests that
touch the packages they exercise, on every push to `main` and `5.x`, and daily,
followed by the JSONPlaceholder suites against the live site to catch drift
between the fixture and the real service. A red advisory run is still worth a
look.

A new case that needs only local resources goes under `test/`; one that talks
to a host outside the CI job goes under `test/external/`. A JSONPlaceholder case
that needs a record the fixture lacks adds it to `db.json`, copied from the real
dataset.

The Wow client and generated-code cases moved with the Wow packages to the
[Wow repository](https://github.com/Ahoo-Wang/Wow/tree/main/typescript), where
they run against a Wow server built from the same commit.

## Prerequisites

- Install root dependencies.
- Build all packages before running tests.
- Nothing else for `pnpm test:it`: it starts its own JSONPlaceholder.
- Provide LLM test variables only through the environment; never commit values.

## Test

From the repository root:

```bash
pnpm install --frozen-lockfile
pnpm build
pnpm test:it            # required cases, local JSONPlaceholder
pnpm test:it:external   # public-internet cases
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
