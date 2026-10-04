---
name: http-status-and-stream-errors
tags: [trigger, pitfall]
runs: 3
max_turns: 8
allowed_tools: [Read, Glob, Grep, Skill]
---

With @ahoo-wang/fetcher-openai streaming chat completions: how do I show the HTTP status when the completion request fails, and not swallow errors that happen mid-stream?
