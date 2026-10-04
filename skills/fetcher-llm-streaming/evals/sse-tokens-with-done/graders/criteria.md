---
type: llm
weight: 1
---

Judge only the agent's final answer. It worked in an empty, read-only directory, so ignore that it wrote no files, could not find the user's code, hedged, or asked follow-up questions: grade the code and explanation it gave. Accept any wording and any equivalent code.

PASS only if the answer does all of these:

1. Defines a terminate detector that stops on `[DONE]` (such as `e => e.data === '[DONE]'`) and passes it to the JSON event stream (`requiredJsonEventStream(detector)`, `jsonEventStream(detector)`, `toJsonServerSentEventStream(stream, detector)` or `jsonEventStreamResultExtractor(detector)`).
2. Iterates with `for await` and appends `event.data.token`.

FAIL if the answer does any of these:

- Parses every `data:` line as JSON with no terminator (including using `JsonEventStreamResultExtractor`, which has none).
- Imports `DoneDetector` from `@ahoo-wang/fetcher-eventstream` (it is not exported there).
- Reads `event.token` instead of `event.data.token`.
