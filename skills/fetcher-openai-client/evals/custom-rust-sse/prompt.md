---
name: custom-rust-sse
tags: [negative]
runs: 3
max_turns: 8
allowed_tools: [Read, Glob, Grep, Skill]
---

Parse an SSE stream from our own Rust service that sends data: {"delta":"…"}.
