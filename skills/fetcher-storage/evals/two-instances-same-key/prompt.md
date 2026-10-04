---
name: two-instances-same-key
tags: [trigger, pitfall]
runs: 3
max_turns: 8
allowed_tools: [Read, Glob, Grep, Skill]
---

Two modules each create `new KeyStorage<string[]>({ key: 'cart' })` from @ahoo-wang/fetcher-storage. After one calls set(), the other's get() still returns the old list in the same tab. Why, and what's the fix?
