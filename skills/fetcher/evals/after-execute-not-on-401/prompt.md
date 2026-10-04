---
name: after-execute-not-on-401
tags: [trigger, pitfall]
runs: 3
max_turns: 8
allowed_tools: [Read, Glob, Grep, Skill]
---

I want afterExecute on my service to redirect to /login when a request returns 401. It never fires. Why?
