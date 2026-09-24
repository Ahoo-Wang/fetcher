---
name: typed-user-service
tags: [trigger]
runs: 3
max_turns: 8
allowed_tools: [Read, Glob, Grep, Skill]
---

Create a typed UserService for /users with getUser(id), list(page) and create(user) using decorators, backed by a named fetcher "api".
