---
name: path-query-typed-json
tags: [trigger, pitfall]
runs: 3
max_turns: 8
allowed_tools: [Read, Glob, Grep, Skill]
---

GET /users/{id} with id=123 and query include=profile, and give me the parsed JSON typed as User.
