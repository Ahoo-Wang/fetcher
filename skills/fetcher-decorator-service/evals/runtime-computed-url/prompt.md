---
name: runtime-computed-url
tags: [negative]
runs: 3
max_turns: 8
allowed_tools: [Read, Glob, Grep, Skill]
---

Using @ahoo-wang/fetcher, write a helper that GETs `/reports/{kind}` where `kind` and an optional set of query filters come from user input on each call, and returns the parsed JSON.
