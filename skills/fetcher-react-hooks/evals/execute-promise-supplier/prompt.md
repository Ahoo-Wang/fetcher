---
name: execute-promise-supplier
tags: [trigger, pitfall]
runs: 3
max_turns: 8
allowed_tools: [Read, Glob, Grep, Skill]
---

I call execute(fetch("/api/x")) with useExecutePromise and it runs twice and ignores abort.
