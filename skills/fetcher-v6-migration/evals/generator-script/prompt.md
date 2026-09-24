---
name: generator-script
tags: [trigger]
runs: 3
max_turns: 8
allowed_tools: [Read, Glob, Grep, Skill]
---

Our package.json has "generate": "fetcher-generator generate -i http://localhost:8080/v3/api-docs -o src/generated" and src/generated imports from @ahoo-wang/fetcher-wow. What changes for Fetcher 6?
