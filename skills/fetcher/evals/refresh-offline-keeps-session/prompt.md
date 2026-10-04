---
name: refresh-offline-keeps-session
tags: [trigger, pitfall]
runs: 3
max_turns: 8
allowed_tools: [Read, Glob, Grep, Skill]
---

Our app uses CoSecConfigurer from @ahoo-wang/fetcher-cosec with a custom TokenRefresher. When the laptop goes offline and the access token expires, should the user be sent to /login? Show how our refresher and the request code should handle a refresh that fails because the network is down versus because the refresh token was rejected.
