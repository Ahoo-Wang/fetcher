---
type: llm
weight: 1
---

Judge only the agent's final answer. It worked in an empty, read-only directory, so ignore that it wrote no files, could not find the user's code, hedged, or asked follow-up questions: grade the code and explanation it gave. Accept any wording and any equivalent code.

PASS only if the answer does all of these:

1. Types the extensions without `any`, for example `Operation & CommonExtensions` or an explicit interface for `x-internal` and `x-tags`.
2. Filters out operations whose `x-internal` is `true`.

FAIL if the answer does any of these:

- Imports a runtime helper from `@ahoo-wang/fetcher-openapi`; the package has none.
