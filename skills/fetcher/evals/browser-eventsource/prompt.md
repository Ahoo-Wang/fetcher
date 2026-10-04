---
name: browser-eventsource
tags: [negative]
runs: 3
max_turns: 8
allowed_tools: [Read, Glob, Grep, Skill]
---

In a plain HTML page with no build step or libraries, use the browser EventSource API to listen to /events and append each message to a <ul>.
