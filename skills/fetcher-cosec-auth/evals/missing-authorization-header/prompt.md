---
name: missing-authorization-header
tags: [trigger, pitfall]
runs: 3
max_turns: 8
allowed_tools: [Read, Glob, Grep, Skill]
---

I configured CoSecConfigurer with appId and tokenStorage but requests never carry an Authorization header.
