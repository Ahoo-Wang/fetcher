---
name: persisted-theme-sync
tags: [negative]
runs: 3
max_turns: 8
allowed_tools: [Read, Glob, Grep, Skill]
---

Our app uses the @ahoo-wang/fetcher packages. Persist the user's theme in localStorage so it survives reloads, and keep it in sync across open tabs.
