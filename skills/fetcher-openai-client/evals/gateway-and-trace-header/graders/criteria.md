---
type: llm
weight: 1
---

Judge only the agent's final answer. It worked in an empty, read-only directory, so ignore that it wrote no files, could not find the user's code, hedged, or asked follow-up questions: grade the code and explanation it gave. Accept any wording and any equivalent code.

PASS only if the answer does all of these:

1. Sets `baseURL` to the gateway URL, including the `/v1` segment.
2. Adds a request interceptor with `openai.fetcher.interceptors.request.use({ name, order, intercept })` that sets the `X-Trace-Id` header.

FAIL if the answer does any of these:

- Reassigns `openai.fetcher`, or passes a headers or `defaultHeaders` option to the `OpenAI` constructor.
