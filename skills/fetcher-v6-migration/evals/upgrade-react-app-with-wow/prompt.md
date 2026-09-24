---
name: upgrade-react-app-with-wow
tags: [trigger]
runs: 3
max_turns: 8
allowed_tools: [Read, Glob, Grep, Skill]
---

Upgrade our React app to Fetcher 6. package.json has @ahoo-wang/fetcher, @ahoo-wang/fetcher-react and @ahoo-wang/fetcher-wow 5.1.2, and src/orders/OrderTable.tsx imports { useFetcher, usePagedQuery } from '@ahoo-wang/fetcher-react'.
