---
type: llm
weight: 1
---

Judge only the agent's final answer. It worked in an empty, read-only directory, so ignore that it wrote no files, could not find the user's code, hedged, or asked follow-up questions: grade the code and explanation it gave. Accept any wording and any equivalent code.

PASS only if the answer does all of these:

1. Explains that `JsonEventStreamResultExtractor` passes no terminate detector, so the end-of-stream line (such as `[DONE]`) is parsed as JSON and throws.
2. Replaces it on that endpoint with a custom result extractor that calls `requiredJsonEventStream(detector)` (or `jsonEventStream(detector)`) with a terminate detector.

FAIL if the answer does any of these:

- Claims `JsonEventStreamResultExtractor` or `ResultExtractors` accepts a detector option.
