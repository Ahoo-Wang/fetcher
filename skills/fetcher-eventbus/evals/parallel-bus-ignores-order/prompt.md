---
name: parallel-bus-ignores-order
tags: [trigger, pitfall]
runs: 3
max_turns: 8
allowed_tools: [Read, Glob, Grep, Skill]
---

Handlers on my ParallelTypedEventBus run out of the order I set. How do I make them sequential?
