---
type: llm
weight: 1
---

Judge only the agent's final answer. It worked in an empty, read-only directory, so ignore that it wrote no files, could not find the user's code, hedged, or asked follow-up questions: grade the code and explanation it gave. Accept any wording and any equivalent code.

PASS only if the answer does all of these:

1. Defines a terminate detector that stops on `[DONE]` and passes it to the JSON event stream (`requiredJsonEventStream(detector)`, `jsonEventStream(detector)` or `toJsonServerSentEventStream(stream, detector)`).
2. Iterates with `for await` and appends `event.data.token`.

FAIL if the answer does any of these:

- Parses every `data:` line as JSON with no terminator, or reads `event.token` instead of `event.data.token`.
