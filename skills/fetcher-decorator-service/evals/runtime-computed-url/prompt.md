---
name: runtime-computed-url
tags: [negative]
runs: 3
max_turns: 8
allowed_tools: [Read, Glob, Grep, Skill]
---

Build a fetch wrapper where the URL path is computed at runtime from user input for each call.
