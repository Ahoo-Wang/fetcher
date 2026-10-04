---
name: refresh-request-loop
tags: [trigger, pitfall]
runs: 3
max_turns: 8
allowed_tools: [Read, Glob, Grep, Skill]
---

Our custom TokenRefresher calls the same fetcher and requests hang in a refresh loop.
