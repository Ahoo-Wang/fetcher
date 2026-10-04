---
name: protected-route
tags: [trigger, pitfall]
runs: 3
max_turns: 8
allowed_tools: [Read, Glob, Grep, Skill]
---

Our Fetcher already has CoSec set up in src/http.ts (`export const tokenStorage = new TokenStorage()` passed to CoSecConfigurer). In our React app (react-router), show /dashboard only to signed-in users, send everyone else to /login, and give the header a sign-out button.
