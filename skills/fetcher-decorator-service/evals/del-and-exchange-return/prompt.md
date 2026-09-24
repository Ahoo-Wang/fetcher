---
name: del-and-exchange-return
tags: [trigger, pitfall]
runs: 3
max_turns: 8
allowed_tools: [Read, Glob, Grep, Skill]
---

My decorated deleteUser method uses @delete and TypeScript cannot find it; also the method returns the parsed JSON but I need the raw exchange for headers.
