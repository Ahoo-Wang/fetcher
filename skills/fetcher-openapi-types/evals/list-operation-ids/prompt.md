---
name: list-operation-ids
tags: [trigger]
runs: 3
max_turns: 8
allowed_tools: [Read, Glob, Grep, Skill]
---

Write a function that lists every operationId in an OpenAPI 3.1 document, typed with the fetcher OpenAPI types.
