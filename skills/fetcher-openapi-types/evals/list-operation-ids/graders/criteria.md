---
type: llm
weight: 1
---

Grade the final answer against $fetcher-openapi-types. Pass only if every point holds:

- Uses `import type { OpenAPI, Operation } from '@ahoo-wang/fetcher-openapi'` (a type-only import; the package has no runtime code to import).
- Iterates `doc.paths` and each PathItem’s HTTP method fields (`get`, `post`, …) to collect `operationId`.
- Handles optional fields (`paths`, `operationId` may be missing).
- Invents no API: every `@ahoo-wang/*` import, class, function, option and constant it uses is one the skill documents (in `SKILL.md` or `references/api.md`). Fail the response if it relies on a symbol, option or package that does not exist.
