---
name: sse-tokens-with-done
tags: [trigger]
runs: 3
max_turns: 8
allowed_tools: [Read, Glob, Grep, Skill]
---

Our /generate endpoint streams SSE lines like data: {"token":"he"} and ends with data: [DONE]. Stream the tokens into a string.
