---
type: llm
weight: 1
---

Judge only the agent's final answer. It worked in an empty, read-only directory, so ignore that it wrote no files, could not find the user's code, hedged, or asked follow-up questions: grade the code and explanation it gave. Accept any wording and any equivalent code.

PASS only if the answer does all of these:

1. States that there is no `@delete` decorator and the right one is `@del`.
2. Returns the raw exchange for that endpoint with `@del(path, { returnType: EndpointReturnType.EXCHANGE })` or `{ resultExtractor: ResultExtractors.Exchange }`, and types the method's return as `Promise<FetchExchange>`.

FAIL if the answer does any of these:

- Suggests `@delete` exists under another import or can be aliased.
- Replaces the decorator with a hand-written `fetcher.delete(...)` call inside the method body.
- Uses `ResultExtractors.Response` or a `Response` return and calls that "the exchange", or says the default return is a `Response` (decorated methods default to parsed JSON).
