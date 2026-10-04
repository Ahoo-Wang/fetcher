---
name: refresh-server-down
tags: [trigger, pitfall]
runs: 3
max_turns: 8
allowed_tools: [Read, Glob, Grep, Skill]
---

With CoSec on our Fetcher, I want users sent to /login only when their session is really over. If the auth server is down or times out during a token refresh, they should stay signed in and see a "try again" toast instead. How do I set that up?
