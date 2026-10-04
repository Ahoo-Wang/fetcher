---
type: llm
weight: 1
---

Judge only the agent's final answer. It worked in an empty, read-only directory, so ignore that it wrote no files, could not find the user's code, hedged, or asked follow-up questions: grade the code and explanation it gave. Accept any wording and any equivalent code.

PASS only if the answer does all of these:

1. Imports the types with `import type` from `@ahoo-wang/fetcher-openapi`.
2. Walks `doc.paths` and each path item's HTTP method fields — all eight (`get`, `put`, `post`, `delete`, `options`, `head`, `patch`, `trace`), for example via the `HTTPMethod` type — collecting `operationId`s and skipping operations without one.

FAIL if the answer does any of these:

- Imports a value (not a type) from `@ahoo-wang/fetcher-openapi`, such as a resolver or iterator function; the package exports types only. Helpers the answer defines itself are fine.
- Iterates every key of a path item (`Object.values(pathItem)`), so `parameters`, `summary`, `servers` or `$ref` are treated as operations.
- Checks only a subset of methods (for example get/post/put/delete) without saying so, or casts `doc` / path items to `any` to read `operationId`.
