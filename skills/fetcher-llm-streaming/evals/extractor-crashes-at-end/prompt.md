---
name: extractor-crashes-at-end
tags: [trigger, pitfall]
runs: 3
max_turns: 8
allowed_tools: [Read, Glob, Grep, Skill]
---

My decorator endpoint uses JsonEventStreamResultExtractor and crashes at the end of every stream.
