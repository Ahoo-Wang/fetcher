# GitHub Actions workflows

Use pnpm 10.34.5 and Node 22/24. Node 20 reached end of life on 2026-04-30 and is no longer tested; the root `engines` asks for Node >=22.12.0, while the libraries keep declaring their own consumer range. Install with `--frozen-lockfile`.
PR updates cancel superseded runs; pushes to main and releases are not cancelled.
Jobs have explicit timeouts (5 minutes for scope/labels, 20 for quality/service
tests, 30 for browser acceptance and 45 for the Node test matrix).

| Workflow                         | Responsibility                                                                                                                                                                                                                                                                                                                                                           |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ci.yml`                         | Build packages and run all package tests on Node 22/24. Node 24 collects and uploads coverage; Node 22 runs the same assertions, compiler/type checks and timeouts without coverage instrumentation.                                                                                                                                                                     |
| `quality.yml`                    | CI policy tests (including the agent-skill drift guard, `skills.test.mjs`), the dependency-direction check (nothing may depend on `@ahoo-wang/wow-*`), changed-file formatting, the published-package type check (`package-types.mjs`: attw on each packed package under node10/node16/bundler), read-only lint, all-package source type checks and documentation build. |
| `pr-quality.yml`                 | Lightweight title/description checks, including edited events, without install/build.                                                                                                                                                                                                                                                                                    |
| `changes.yml`                    | Reusable conservative change classification. Workflows always start; irrelevant jobs skip without leaving workflow-level path checks pending.                                                                                                                                                                                                                            |
| `build-storybook.yml`            | Package build, story type check, one Storybook production build with its static index check, and Chromium interaction tests in two shards on separate runners, run from source without a package build. `STORYBOOK_BROWSERS` widens the matrix; see below.                                                                                                               |
| `integration-test.yml`           | Build the integration workspace and dependencies, type-check it, and run the core integration tests against real HTTP services.                                                                                                                                                                                                                                          |
| `downstream-wow.yml`             | Advisory, not required: on changes to the core packages Wow consumes, build them, link them into a checkout of Ahoo-Wang/Wow through `pnpm.overrides`, and run Wow's TypeScript unit tests and type checks.                                                                                                                                                              |
| `pr-labeler.yml`                 | Apply labels using trusted base configuration; never check out PR code in the write-permission workflow.                                                                                                                                                                                                                                                                 |
| `deploy-wiki.yml`                | Build packages once, then Wiki and Storybook, deploy GitHub Pages.                                                                                                                                                                                                                                                                                                       |
| `release.yml`                    | Admit the checked-out SHA against successful full CI and trusted quality checks before build/publish.                                                                                                                                                                                                                                                                    |
| `gitee-sync.yml`, `renovate.yml` | Existing repository automation; unchanged.                                                                                                                                                                                                                                                                                                                               |

## Scope and gates

Any package, lockfile, root configuration, CI script or unknown path runs all
verification scopes. Only known independent paths narrow the work:

- `wiki/**`: documentation build.
- `stories/**`, `.storybook/**`: Storybook acceptance and documentation build.
- `integration-test/**`: integration tests and static checks.
- Root README/license, Markdown in `docs/**`, `skills/**` and anywhere under
  `packages/<name>/`, and PR/issue templates: formatting and metadata checks.
  A regression test requires that no package test reads a `.md` file, so
  package Markdown stays documentation only. Markdown next to any other change
  still runs every scope. Changes to executable root scripts remain full scope.

Main pushes and manual dispatch always run all scopes. Deleted and renamed paths
are included in classification: rename detection is disabled so both the old and
new paths are assessed. A real Git repository regression verifies source-to-docs
moves cannot skip code tests; invalid revisions fail closed. Errors while determining scope fail the job.
The source and regression cases live in `.github/scripts/ci-scope*`.

PR description structure is guided by the template, not brittle prose parsing.
The separate metadata workflow requires a Conventional Commit title and meaningful
body after removing template comments and empty headings. Editing PR prose does
not retrigger package builds or static/documentation checks.
Dependency bots obey the same minimum rules.

No repository branch/ruleset settings are changed by these workflows. If adding
required checks, use current job names: the removed standalone
`build-test-upload-coverage` job is replaced by Node 24 CI and Codecov checks.
At inspection, main had no classic branch protection and an active Copilot rule.
Recheck repository settings before changing enforcement.

## Verification and cost

Local checks:

```sh
node --test .github/scripts/*.test.mjs
actionlint
pnpm -r --filter './packages/*' build
pnpm -r --filter './packages/*' exec eslint .
pnpm --dir integration-test exec eslint .
pnpm lint:stories
pnpm typecheck:stories
pnpm -r --filter './packages/*' exec tsc --noEmit --incremental false --composite false
VITEST_MAX_WORKERS=1 pnpm test:unit
pnpm --dir wiki build
```

Formatting uses Prettier already installed by the fetcher workspace, since the
root does not declare a direct Prettier dependency. Only changed files are checked;
no repository-wide rewrite is performed. Manual dispatch formats HEAD's diff
against its parent.

The skill drift guard (`skills.test.mjs`) checks only the shape of each skill's
`claude plugin eval` suite (`skills/<skill>/evals/<case>/`). Running the suites
is `pnpm eval:skills`: it needs a Claude login and spends money per run, so it
is local only and no workflow calls it.

The React package build checks generated declaration imports as a real consumer,
without source aliases, in addition to ESM context identity. The core runtime output
uses `core.es.js` so relative declaration imports of `./core` resolve to the
`core/index.d.ts` directory rather than the JavaScript entrypoint. Unit tests retain
existing type and architecture contract checks. Every package runs an explicit `tsc --noEmit` against built dependencies, once
in Engineering Quality. The integration job type-checks its sources as well. Build log diagnostics alone are not proof of a failing
exit status. Node 24 coverage JSON is retained as a seven-day artifact even when
a later uploader fails.

Baseline run 34383307720: Node 24 install 4s, build 74s, lint 29s, tests 1016s.
The changes remove one complete duplicate coverage build/test, two repeated lint
runs, the duplicate Storybook production build, and repeated integration install.
They do not reduce the Node matrix, browsers, test assertions or performance and
coverage thresholds. Actual elapsed-time improvement requires a new CI run;
runner load and cache state make local timing unsuitable for that claim.

Performance acceptance must run separately from CPU-heavy tests/builds. Keep
phase timings and failure artifacts; do not rerun a performance failure until it
passes. Distinguish source-repository/network failures from code defects.

## Secrets

Codecov, npm, optional LLM integration and mirroring secrets stay in GitHub
settings. Do not print them. No PR code is executed by the privileged
labeler. Coverage uploader failures fail Node 24 CI rather than being hidden.

Third-party pnpm/Codecov/labeler actions are pinned to verified commit SHAs.
`downstream-wow.yml` reads Ahoo-Wang/Wow anonymously with read-only
`contents` permission and receives no secrets.

## Release admission

`pnpm update-version <version>` versions every workspace package and
`scripts/publish-npm.sh` publishes every scoped one. The isolated
release-script test uses a fake publisher and never sends packages to npm.

Admission reads `git rev-parse HEAD` after checkout (including release tags), then
requires the latest successful `push` or `workflow_dispatch` run for that SHA of
CI, Engineering Quality, Build Storybook and Integration Test (Generator Test
moved to the Wow repository with the generator; a regression test requires
every listed workflow to exist).
PR runs are excluded because they may test a synthetic merge. Main pushes now
also run Storybook delivery verification. Missing/pending/failed checks block;
manual dispatch of the verification workflows can validate another release SHA.
Codacy checks must come from the expected GitHub App. Codacy analyses pull
request heads rather than pushes, so a release tagged on a squashed merge
commit carries no Codacy Check Run of its own; admission then falls back to the
head of the pull request that was merged AS that very commit, and refuses to
guess when there is not exactly one. Codecov project checks
must come from the Codecov App; when no such Check Run exists, the latest
`codecov/project` commit status must be successful and authored by the
`codecov[bot]` Bot account. A failed Check Run cannot fall back to a status.
No npm publish command is invoked by policy tests or local admission verification.

Default `pnpm test:unit` still collects coverage. `test:no-coverage` scripts retain
all existing commands and timeouts; a regression check prevents the
compatibility suite from drifting away from the default suite. Coverage thresholds
remain unchanged and enforced by Node 24.

## Critical-path follow-up

Completed Node 20/22 compatibility tests in run 34415983833 took 711s/665s;
builds took 40s/32s. Coverage removal alone did not eliminate the long test path.
Use the locally validated scheduler (one workspace at a time, two Vitest workers)
instead of several workspaces each with one worker. All assertions remain.

Storybook run 34415983847 took about eight minutes: interactions 111s and
delivery 285s were sequential. They now use independent runners; the delivery job keeps its package build and the interaction shards run from source.

Interactions run on Chromium; `STORYBOOK_BROWSERS=chromium,firefox,webkit pnpm
test:storybook` runs the matrix locally.
This trades one additional setup/build for overlap. Actual wall-clock savings
must be measured on the new CI run, not inferred from local hardware.

## Shard the Storybook interactions

Storybook interactions run as `Storybook interactions (n/2)`, each a Vitest
`--shard` of the same suite, with the Playwright browser download cached by
version. They build no package: `.storybook/main.ts` resolves every workspace
package to its source, and a regression test requires that alias list to name
every directory in `packages/`. The delivery job still builds, because
`typecheck:stories` checks the stories against the built declarations.

## One suite, two Node versions

Since the Wow packages moved to the Wow repository (migration step 3′: Wow
client, React hooks, view engine and generator; the frozen viewer stays on the
`5.x` branch), each Node version runs a single `core` suite with every package.
The partition regression uses pnpm's actual workspace selection to require
every package exactly once; the matrix keeps its `suite` axis so a future split
is a one-line change.

Node 24 artifacts preserve `packages/<name>/coverage/coverage-final.json` paths.
Node 24 (`node24`) is split from the Node 22 compatibility matrix
(`build-and-test`), so the combined coverage job waits for the Node 24 job only.
Compatibility jobs still gate CI. The coverage job requires a valid JSON report
from every package before uploading once.

## Downstream Wow check

`downstream-wow.yml` runs when a pull request or a push touches a core package
the Wow TypeScript packages consume — `fetcher`, `decorator`, `eventstream`,
`openapi`, or `react/src/core` and `react/src/fetcher` (the two subpaths
`@ahoo-wang/wow-react` imports). It builds those packages, checks out
Ahoo-Wang/Wow's `main`, points `pnpm.overrides` at the built workspace
directories, installs without the lockfile, and runs Wow's TypeScript unit
tests and type checks. It is advisory: nothing requires it, and a failure
means "Wow will need a change when it picks up this fetcher version", not
"this change is wrong".
