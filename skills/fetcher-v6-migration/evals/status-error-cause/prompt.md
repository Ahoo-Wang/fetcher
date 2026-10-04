---
name: status-error-cause
tags: [trigger, pitfall]
runs: 3
max_turns: 8
allowed_tools: [Read, Glob, Grep, Skill]
---

We upgraded @ahoo-wang/fetcher from 5.1.5 to 6.0.0. It compiles, but our 404 handling stopped firing:

```ts
try {
  return await api.get('/users/{id}', { urlParams: { path: { id } } });
} catch (error) {
  if (
    error instanceof ExchangeError &&
    error.cause instanceof HttpStatusValidationError
  ) {
    return null; // not found
  }
  throw error;
}
```

Why, and what should it be?
