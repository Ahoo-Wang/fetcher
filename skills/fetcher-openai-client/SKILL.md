---
name: fetcher-openai-client
description: >
  Use when calling OpenAI Chat Completions through Fetcher, configuring OpenAI or ChatClient, sending streaming or non-streaming chat completion requests, adding interceptors, using completion result extractors, or handling OpenAI client errors.
---

# fetcher-openai-client

## Use This Skill When

- The task needs an OpenAI chat completion client built on Fetcher.
- The task mentions `OpenAI`, `ChatClient`, chat completions, streaming completions, or completion result extractors.
- The task needs OpenAI request interceptors, base URL configuration, or error handling.
- The task is about this repository's `@ahoo-wang/fetcher-openai` package rather than general OpenAI platform usage.

## Workflow

1. Configure the Fetcher-backed `OpenAI` entry point before using `ChatClient` directly.
2. Choose streaming or non-streaming result extraction based on the caller contract.
3. Use interceptors for auth, tracing, or request customization rather than scattering request changes.
4. For current OpenAI platform behavior, verify against official docs before changing package semantics.
5. Load `references/api.md` for class APIs, type shapes, streaming examples, and error handling patterns.

## Key Practices

- Keep this skill scoped to Fetcher integration code; route generic OpenAI API questions to official docs workflows.
- Do not duplicate SSE parsing logic here when `fetcher-llm-streaming` covers the stream mechanics.
- Make streaming consumers handle partial data and errors explicitly.

## References

- `references/api.md`: Detailed package API, examples, and edge-case guidance. Load it only when the task needs OpenAI and ChatClient APIs, chat completion types, streaming and non-streaming examples, interceptors, and error handling snippets.

## Related Skills

- $fetcher-llm-streaming: Use for lower-level SSE and token stream handling.
- $fetcher-integration: Use for core Fetcher interceptors and request lifecycle behavior.
- $fetcher-react-hooks: Use when OpenAI calls are exposed through React state hooks.
