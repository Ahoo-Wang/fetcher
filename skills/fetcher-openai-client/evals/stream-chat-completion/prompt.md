---
name: stream-chat-completion
tags: [trigger]
runs: 3
max_turns: 8
allowed_tools: [Read, Glob, Grep, Skill]
---

Our TypeScript app makes its HTTP calls with @ahoo-wang/fetcher. Stream a chat completion from gpt-4o-mini and print tokens as they arrive.
