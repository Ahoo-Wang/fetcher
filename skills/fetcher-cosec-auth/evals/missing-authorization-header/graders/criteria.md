---
type: llm
weight: 1
---

Judge only the agent's final answer. It worked in an empty, read-only directory, so ignore that it wrote no files, could not find the user's code, hedged, or asked follow-up questions: grade the code and explanation it gave. Accept any wording and any equivalent code.

PASS only if the answer does all of these:

1. Says the Authorization interceptors are only registered when `tokenRefresher` is set on the `CoSecConfigurer` config, so with only `appId` and `tokenStorage` no Bearer header is sent.
2. Fixes the configuration by adding a `tokenRefresher` (for example `CoSecTokenRefresher`).

FAIL if the answer does any of these:

- Gives only unrelated causes (header name, CORS, token format) without the missing `tokenRefresher`.
