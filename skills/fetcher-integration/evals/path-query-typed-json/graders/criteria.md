---
type: llm
weight: 1
---

Judge only the agent's final answer. It worked in an empty, read-only directory, so ignore that it wrote no files, could not find the user's code, hedged, or asked follow-up questions: grade the code and explanation it gave. Accept any wording and any equivalent code.

PASS only if the answer does all of these:

1. Uses the `/users/{id}` template with `urlParams: { path: { id: 123 }, query: { include: 'profile' } }`.
2. Gets the parsed body typed as `User`, either with `{ resultExtractor: ResultExtractors.Json }` as the third argument or by calling `.json()` on the returned `Response`.

FAIL if the answer does any of these:

- Treats the plain `fetcher.get(...)` result as the parsed user (no result extractor and no `.json()`).
- Passes query parameters as an Axios-style `params` option.
