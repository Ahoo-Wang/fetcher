---
name: no-prototype-patch
tags: [trigger]
runs: 3
max_turns: 8
allowed_tools: [Read, Glob, Grep, Skill]
---

I maintain a library that must not patch Response.prototype. Can I import toServerSentEventStream / toJsonServerSentEventStream from @ahoo-wang/fetcher-eventstream to parse the SSE body without that side effect?
