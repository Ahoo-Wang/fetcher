---
name: tenant-path-from-jwt
tags: [trigger]
runs: 3
max_turns: 8
allowed_tools: [Read, Glob, Grep, Skill]
---

Requests to /tenant/{tenantId}/orders should use the tenant from the logged-in JWT.
