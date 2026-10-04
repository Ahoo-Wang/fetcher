---
name: cross-tab-theme-sync
tags: [trigger]
runs: 3
max_turns: 8
allowed_tools: [Read, Glob, Grep, Skill]
---

Our app persists the theme with a KeyStorage from @ahoo-wang/fetcher-storage (key 'app:theme'). Make the theme stay in sync across browser tabs.
