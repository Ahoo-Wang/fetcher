---
type: llm
weight: 1
---

Judge only the agent's final answer. It worked in an empty, read-only directory, so ignore that it wrote no files, could not find the user's code, hedged, or asked follow-up questions: grade the code and explanation it gave. Accept any wording and any equivalent code.

PASS only if the answer does all of these:

1. Says no: importing anything from `@ahoo-wang/fetcher-eventstream`, the standalone converters included, runs the module's side effect that patches `Response.prototype`.
2. Concludes that a library which must not patch the prototype cannot depend on the package, and offers an alternative such as its own SSE parser.

FAIL if the answer does any of these:

- Claims that importing only the named converters avoids the prototype patch.
