---
name: debounced-search-box
tags: [trigger]
runs: 3
max_turns: 8
allowed_tools: [Read, Glob, Grep, Skill]
---

Our React app uses @ahoo-wang/fetcher-react. Build a search box component that POSTs { keyword } to /api/search as the user types (300 ms debounce) and shows loading, results and errors.
