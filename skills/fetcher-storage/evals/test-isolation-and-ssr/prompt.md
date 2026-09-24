---
name: test-isolation-and-ssr
tags: [trigger, pitfall]
runs: 3
max_turns: 8
allowed_tools: [Read, Glob, Grep, Skill]
---

My KeyStorage unit tests leak state between tests and behave differently under SSR.
