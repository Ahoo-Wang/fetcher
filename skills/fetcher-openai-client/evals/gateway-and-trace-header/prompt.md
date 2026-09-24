---
name: gateway-and-trace-header
tags: [trigger]
runs: 3
max_turns: 8
allowed_tools: [Read, Glob, Grep, Skill]
---

Point the client at our OpenAI-compatible gateway and add an X-Trace-Id header to every request.
