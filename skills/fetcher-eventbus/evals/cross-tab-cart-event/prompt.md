---
name: cross-tab-cart-event
tags: [trigger]
runs: 3
max_turns: 8
allowed_tools: [Read, Glob, Grep, Skill]
---

Create a typed "cart-updated" event that all open browser tabs receive, with an audit handler that runs before a UI handler.
