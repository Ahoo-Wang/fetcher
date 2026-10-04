---
name: axios-auth-interceptor
tags: [negative]
runs: 3
max_turns: 8
allowed_tools: [Read, Glob, Grep, Skill]
---

Our Next.js app calls its API with axios. Add a request interceptor that attaches the bearer token from localStorage, and retry once on 503.
