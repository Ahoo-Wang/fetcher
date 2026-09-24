---
type: llm
weight: 1
---

Grade the final answer against $fetcher-openai-client. Pass only if every point holds:

- Creates `new OpenAI({ baseURL: 'https://api.openai.com/v1', apiKey })`.
- Calls `await openai.chat.completions({ model: 'gpt-4o-mini', messages, stream: true })`.
- Iterates the result with `for await`, printing `event.data.choices[0]?.delta?.content`.
- Invents no API: every `@ahoo-wang/*` import, class, function, option and constant it uses is one the skill documents (in `SKILL.md` or `references/api.md`). Fail the response if it relies on a symbol, option or package that does not exist.
