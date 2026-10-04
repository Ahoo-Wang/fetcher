---
type: llm
weight: 1
---

Judge only the agent's final answer. It worked in an empty, read-only directory, so ignore that it wrote no files, could not find the user's code, hedged, or asked follow-up questions: grade the code and explanation it gave. Accept any wording and any equivalent code.

PASS only if the answer does all of these:

1. Explains that `JsonEventStreamResultExtractor` passes no terminate detector, so the end-of-stream line (such as `data: [DONE]`) is parsed as JSON and throws a `SyntaxError`.
2. Replaces it on that endpoint with `jsonEventStreamResultExtractor(detector)` (for example `jsonEventStreamResultExtractor(e => e.data === '[DONE]')`), or with an equivalent custom `ResultExtractor` that calls `requiredJsonEventStream(detector)`.

FAIL if the answer does any of these:

- Passes an option or detector to the `JsonEventStreamResultExtractor` constant (for example `JsonEventStreamResultExtractor({ terminate })`) or looks for an SSE extractor on `ResultExtractors` from `@ahoo-wang/fetcher`.
- Fixes it by catching and ignoring the error at the end of the loop.
