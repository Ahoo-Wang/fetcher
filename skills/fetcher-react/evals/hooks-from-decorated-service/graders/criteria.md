---
type: llm
weight: 1
---

Judge only the agent's final answer. It worked in an empty, read-only directory, so ignore that it wrote no files, could not find the user's code, hedged, or asked follow-up questions: grade the code and explanation it gave. Accept any wording and any equivalent code. The project is on `@ahoo-wang/fetcher-react` 6.

PASS only if the answer does all of these:

1. Generates the hooks (assuming a plausible `UserService` shape is fine) with `createQueryApiHooks({ api: service })` and/or `createExecuteApiHooks({ api: service })`, producing hooks such as `useGetUser`/`useUpdateUser`.
2. Uses them with the 6.x options: an execute hook's `execute(...params)`, and a query hook's `{ query }` option driven by the component's own state.

FAIL if the answer does any of these:

- Hand-writes a wrapper hook per method instead of generating them.
- Uses options 6.0 removed: `onBeforeExecute`, `initialQuery`, or a `setQuery`/`getQuery` returned by a query hook.
