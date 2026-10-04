---
name: gateway-and-trace-header
tags: [trigger]
runs: 3
max_turns: 8
allowed_tools: [Read, Glob, Grep, Skill]
---

We use @ahoo-wang/fetcher-openai. Point the client at our OpenAI-compatible gateway (https://llm.example.com/v1) and send a fresh X-Trace-Id on every request, plus a fixed X-Tenant: acme header.
