# GitHub Actions workflows

Use pnpm 10.34.5 and Node 20/22/24. Install with `--frozen-lockfile`.
PR updates cancel superseded runs; pushes to main and releases are not cancelled.
Jobs have explicit timeouts (5 minutes for scope/labels, 20 for quality/service
tests, 30 for browser acceptance and 45 for the Node test matrix).

| Workflow                                         | Responsibility                                                                                                                                                                                            |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ci.yml`                                         | Build packages and run all package tests on Node 20/22/24. Node 24 collects and uploads coverage; Node 20/22 run the same assertions, compiler/type checks and timeouts without coverage instrumentation. |
| `quality.yml`                                    | CI policy tests, changed-file formatting, read-only lint, all-package source type checks and documentation build.                                                                                         |
| `pr-quality.yml`                                 | Lightweight title/description checks, including edited events, without install/build.                                                                                                                     |
| `changes.yml`                                    | Reusable conservative change classification. Workflows always start; irrelevant jobs skip without leaving workflow-level path checks pending.                                                             |
| `build-storybook.yml`                            | Package build, interaction tests, package/host recovery and Chromium/Firefox/WebKit acceptance. The delivery verifier owns the one Storybook production build.                                            |
| `integration-test.yml`                           | Build the integration workspace and dependencies, invoke the built generator directly, and run integration tests.                                                                                         |
| `generator-test.yml`                             | Verify generation against both supported Wow versions.                                                                                                                                                    |
| `pr-labeler.yml`                                 | Apply labels using trusted base configuration; never check out PR code in the write-permission workflow.                                                                                                  |
| `deploy-wiki.yml`                                | Build packages once, then Wiki and Storybook, deploy GitHub Pages.                                                                                                                                        |
| `release.yml`                                    | Admit the checked-out SHA against successful full CI and trusted quality checks before build/publish.                                                                                                     |
| `gitee-sync.yml`, `renovate.yml`, `opencode.yml` | Existing repository automation; unchanged.                                                                                                                                                                |

## Scope and gates

Any package, lockfile, root configuration, CI script or unknown path runs all
verification scopes. Only known independent paths narrow the work:

- `wiki/**`: documentation build.
- `stories/**`, `.storybook/**`: Storybook acceptance and documentation build.
- `integration-test/**`: integration tests and static checks.
- Root README/license, Markdown in `docs/**` and `skills/**`, and PR/issue templates: formatting
  and metadata checks. Changes to executable root scripts remain full scope.

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
pnpm lint:view-engine:stories
pnpm -r --filter './packages/*' exec tsc --noEmit --incremental false --composite false
VITEST_MAX_WORKERS=1 pnpm test:unit
pnpm --dir wiki build
```

Formatting uses Prettier already installed by the fetcher workspace, since the
root does not declare a direct Prettier dependency. Only changed files are checked;
no repository-wide rewrite is performed. Manual dispatch formats HEAD's diff
against its parent.

The React package build checks generated declaration imports as a real consumer,
without source aliases, in addition to ESM context identity. The core runtime output
uses `core.es.js` so relative declaration imports of `./core` resolve to the
`core/index.d.ts` directory rather than the JavaScript entrypoint. Unit tests retain
existing type and architecture contract checks. Every package runs an explicit `tsc --noEmit` against built dependencies, once
in Engineering Quality. The integration job type-checks its generated sources
after generation as well. Build log diagnostics alone are not proof of a failing
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

Codecov, npm, optional LLM integration, mirroring and assistant secrets stay in
GitHub settings. Do not print them. No PR code is executed by the privileged
labeler. Coverage uploader failures fail Node 24 CI rather than being hidden.

Third-party pnpm/Codecov/labeler actions are pinned to verified commit SHAs.
The integration job calls the built generator by its workspace path: an install
before build cannot create a bin link whose target does not exist yet. This
avoids relying on a second installation to repair that link.

## Release admission

Admission reads `git rev-parse HEAD` after checkout (including release tags), then
requires the latest successful `push` or `workflow_dispatch` run for that SHA of
CI, Engineering Quality, Build Storybook, Integration Test and Generator Test.
PR runs are excluded because they may test a synthetic merge. Main pushes now
also run Storybook delivery verification. Missing/pending/failed checks block;
manual dispatch of the verification workflows can validate another release SHA.
Codacy and Codecov project checks must come from their expected GitHub Apps.
No npm publish command is invoked by policy tests or local admission verification.

Default `pnpm test:unit` still collects coverage. `test:no-coverage` scripts retain
all existing commands and generator timeouts; a regression check prevents the
compatibility suite from drifting away from the default suite. Coverage thresholds
remain unchanged and enforced by Node 24.

## Critical-path follow-up

Completed Node 20/22 compatibility tests in run 34415983833 took 711s/665s;
builds took 40s/32s. Coverage removal alone did not eliminate the long test path.
Use the locally validated scheduler (one workspace at a time, two Vitest workers)
instead of several workspaces each with one worker. All assertions remain.

Storybook run 34415983847 took about eight minutes: interactions 111s and
delivery 285s were sequential. They now use independent runners, each retaining
its required package build; delivery still runs all three browsers in isolation.
This trades one additional setup/build for overlap. Actual wall-clock savings
must be measured on the new CI run, not inferred from local hardware.
