---
name: named-client-with-auth-interceptor
tags: [trigger]
runs: 3
max_turns: 8
allowed_tools: [Read, Glob, Grep, Skill]
---

Set up a Fetcher client for https://api.example.com with a 5 second timeout and a request interceptor that adds a Bearer token from localStorage; other modules should get it by name.
