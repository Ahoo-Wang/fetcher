---
type: llm
weight: 1
---

Judge only the agent's final answer. It worked in an empty, read-only directory, so ignore that it wrote no files, could not find the user's code, hedged, or asked follow-up questions: grade the code and explanation it gave. Accept any wording and any equivalent code.

PASS only if the answer does all of these:

1. Creates `new OpenAI({ baseURL, apiKey, ... })` with `baseURL` set to the gateway URL, including the `/v1` segment.
2. Generates the trace id per request in a request interceptor: `openai.fetcher.interceptors.request.use({ name, order, intercept })` that sets `X-Trace-Id` on the exchange's request headers.
3. Sends `X-Tenant` either through the `headers` option of `new OpenAI(...)` or in the same interceptor.

FAIL if the answer does any of these:

- Puts `X-Trace-Id` in the constructor's `headers`, computed once, so every request carries the same id.
- Reassigns `openai.fetcher`, or uses options of the official `openai` SDK such as `defaultHeaders` or `chat.completions.create`.
- Registers an interceptor without `name` and `order`.
