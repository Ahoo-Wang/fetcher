---
name: status-404-and-duplicate-interceptor
tags: [trigger, pitfall]
runs: 3
max_turns: 8
allowed_tools: [Read, Glob, Grep, Skill]
---

Our /orders endpoint returns 404 for an empty cart and I want to treat that as data, not an exception. Also my error interceptor logs twice. What should I change?
