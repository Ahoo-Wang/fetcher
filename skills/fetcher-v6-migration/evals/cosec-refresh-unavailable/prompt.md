---
name: cosec-refresh-unavailable
tags: [trigger, pitfall]
runs: 3
max_turns: 8
allowed_tools: [Read, Glob, Grep, Skill]
---

Since we upgraded @ahoo-wang/fetcher-cosec from 5.1 to 6.0, users are no longer sent to /login when our token refresh endpoint is down (it returns 503) — onUnauthorized never fires and the request just fails. Is this a bug in 6.0? Our CoSecConfigurer uses CoSecTokenRefresher with endpoint /auth/refresh.
