---
name: use-query-set-query
tags: [trigger]
runs: 3
max_turns: 8
allowed_tools: [Read, Glob, Grep, Skill]
---

We bumped @ahoo-wang/fetcher-react to 6.0.0 and this no longer compiles. How should it look now?

```tsx
const { result, loading, setQuery, execute } = useQuery({
  initialQuery: { keyword: '' },
  propagateError: true,
  execute: (query, attributes, abortController) =>
    api.search(query, abortController),
});

const onRefresh = async () => {
  try {
    await execute();
    toast('Refreshed');
  } catch (error) {
    toast(error.message);
  }
};
```
