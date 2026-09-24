---
name: on-returns-boolean
tags: [trigger, pitfall]
runs: 3
max_turns: 8
allowed_tools: [Read, Glob, Grep, Skill]
---

I call bus.on(handler) and store the return value to unsubscribe later, but calling it throws "not a function".
