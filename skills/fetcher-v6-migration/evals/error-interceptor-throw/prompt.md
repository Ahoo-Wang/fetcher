---
name: error-interceptor-throw
tags: [trigger, pitfall]
runs: 3
max_turns: 8
allowed_tools: [Read, Glob, Grep, Skill]
---

After upgrading @ahoo-wang/fetcher to 6.0 our 403 handling broke. Our error interceptor throws `new AccessDeniedError()` on a 403 and the page does `catch (e) { if (e instanceof AccessDeniedError) showDenied(); else throw e; }`. Now the instanceof check is always false. What changed?
