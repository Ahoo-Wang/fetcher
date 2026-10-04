---
name: interceptor-for-decorated-services
tags: [negative]
runs: 3
max_turns: 8
allowed_tools: [Read, Glob, Grep, Skill]
---

My NamedFetcher 'api' backs several decorated service classes. Add a request interceptor that stamps a fresh X-Request-Id header on every request they make.
