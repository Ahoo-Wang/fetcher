---
name: persisted-theme-default
tags: [trigger]
runs: 3
max_turns: 8
allowed_tools: [Read, Glob, Grep, Skill]
---

Using @ahoo-wang/fetcher-storage, persist the user's theme ({ mode: 'light' | 'dark' }) with a light default and log every change.
