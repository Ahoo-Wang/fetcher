---
name: jwt-refresh-and-redirect
tags: [trigger]
runs: 3
max_turns: 8
allowed_tools: [Read, Glob, Grep, Skill]
---

Add CoSec JWT auth to our Fetcher: refresh tokens at /auth/refresh, redirect to /login when refresh fails, and warn on 403.
