---
name: custom-rust-sse
tags: [negative]
runs: 3
max_turns: 8
allowed_tools: [Read, Glob, Grep, Skill]
---

Our app uses @ahoo-wang/fetcher. Our own Rust service at POST /v1/generate streams SSE lines like data: {"delta":"…"} and ends with data: [DONE]. Collect the deltas into a string.
