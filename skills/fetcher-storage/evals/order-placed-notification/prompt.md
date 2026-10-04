---
name: order-placed-notification
tags: [negative]
runs: 3
max_turns: 8
allowed_tools: [Read, Glob, Grep, Skill]
---

Our app uses the @ahoo-wang/fetcher packages. When an order is placed, notify other components and other open browser tabs; nothing needs to be stored.
