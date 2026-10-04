---
type: llm
weight: 1
---

Judge only the agent's final answer. It worked in an empty, read-only directory, so ignore that it wrote no files, could not find the user's code, hedged, or asked follow-up questions: grade the code and explanation it gave. Accept any wording and any equivalent code.

PASS only if the answer does all of these:

1. Creates the client with `new OpenAI({ baseURL, apiKey })` from `@ahoo-wang/fetcher-openai`, with a base URL that includes `/v1`.
2. Calls `openai.chat.completions({ model: 'gpt-4o-mini', messages, stream: true })`.
3. Iterates with `for await` and prints `event.data.choices[0]?.delta?.content`.

FAIL if the answer does any of these:

- Calls `chat.completions.create(...)`.
- Uses the official `openai` npm SDK instead of `@ahoo-wang/fetcher-openai`.
