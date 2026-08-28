# GitHub Actions workflows

CI workflows run with pnpm 10.34.5 and current supported Node.js versions.
Reproduce the matching local gate before changing workflow configuration.

| Workflow               | Trigger                           | Purpose                                                     | Local equivalent                                              |
| ---------------------- | --------------------------------- | ----------------------------------------------------------- | ------------------------------------------------------------- |
| `ci.yml`               | Push/PR to `main`, manual         | Build, lint, and package unit tests on Node 20/22/24        | `pnpm build && pnpm lint && pnpm test:unit`                   |
| `build-storybook.yml`  | PR to `main`, manual              | Build packages, test interactions, build Storybook          | `pnpm build && pnpm test:storybook && pnpm build-storybook`   |
| `codecov.yml`          | Push/PR to `main`, manual         | Build, unit coverage, Codecov upload                        | `pnpm build && pnpm test:unit`                                |
| `integration-test.yml` | Push/PR to `main`, manual         | Wow service, generation, integration and optional LLM tests | Follow `integration-test/README.md`                           |
| `generator-test.yml`   | Push/PR to `main`, manual         | Generate clients against supported Wow server versions      | Run generator against the matching local server               |
| `deploy-wiki.yml`      | Relevant `main` changes, manual   | Build Wiki and Storybook, deploy GitHub Pages               | `pnpm build && pnpm --dir wiki build && pnpm build-storybook` |
| `release.yml`          | GitHub release, manual            | Build and publish all packages to npm                       | No ordinary local equivalent                                  |
| `gitee-sync.yml`       | Schedule, selected pushes, manual | Mirror the repository to Gitee                              | No local equivalent                                           |
| `renovate.yml`         | Schedule, manual                  | Run self-hosted dependency updates                          | Inspect `renovate.json`                                       |
| `opencode.yml`         | Explicit PR/issue comment command | Run the configured coding assistant                         | No local equivalent                                           |

## Secrets

Workflows reference secret categories for Codecov, npm publishing, repository
mirroring, Renovate, the coding assistant, and optional LLM integration tests.
Secret values belong in GitHub environment/repository settings and must never be
printed, copied into workflow files, or included in fixtures.

## Triage

1. Open the full failing job log and find the first failing command.
2. Reproduce that exact command and Node version locally.
3. Distinguish service readiness, missing secret, network, generation, build,
   lint, and test failures.
4. Fix the smallest owning layer; do not weaken checks to make a job green.
