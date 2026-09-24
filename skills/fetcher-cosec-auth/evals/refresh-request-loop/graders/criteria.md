---
type: llm
weight: 1
---

Judge only the agent's final answer. It worked in an empty, read-only directory, so ignore that it wrote no files, could not find the user's code, hedged, or asked follow-up questions: grade the code and explanation it gave. Accept any wording and any equivalent code.

PASS only if the answer does all of these:

1. Identifies the cause: the refresh request goes through the same CoSec-configured fetcher, so its auth interceptors try to refresh the refresh call again.
2. Fixes it by marking the refresh request with the `IGNORE_REFRESH_TOKEN_ATTRIBUTE_KEY` attribute, or by switching to `CoSecTokenRefresher` (which already sets it).
