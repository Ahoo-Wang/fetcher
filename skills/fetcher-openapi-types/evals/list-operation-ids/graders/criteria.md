---
type: llm
weight: 1
---

Judge only the agent's final answer. It worked in an empty, read-only directory, so ignore that it wrote no files, could not find the user's code, hedged, or asked follow-up questions: grade the code and explanation it gave. Accept any wording and any equivalent code.

PASS only if the answer does all of these:

1. Imports the types with `import type` from `@ahoo-wang/fetcher-openapi`.
2. Walks `doc.paths` and each path item's HTTP method fields (`get`, `post`, …), collecting `operationId`s and skipping missing ones.

FAIL if the answer does any of these:

- Imports a value (not a type) from `@ahoo-wang/fetcher-openapi`, such as a resolver or iterator function; the package exports types only. Helpers the answer defines itself are fine.
