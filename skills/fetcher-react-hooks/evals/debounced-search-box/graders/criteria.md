---
type: llm
weight: 1
---

Judge only the agent's final answer. It worked in an empty, read-only directory, so ignore that it wrote no files, could not find the user's code, hedged, or asked follow-up questions: grade the code and explanation it gave. Accept any wording and any equivalent code. The project is on `@ahoo-wang/fetcher-react` 6, whose query hooks are controlled.

PASS only if the answer does all of these:

1. Debounces with a hook from `@ahoo-wang/fetcher-react` at 300 ms (`debounce: { delay: 300 }` or `{ delay: 300 }`): `useDebouncedFetcherQuery` (or `useDebouncedQuery`), `useDebouncedValue` feeding `useFetcherQuery`/`useQuery`, or `useDebouncedFetcher` with `run(...)` called from the input handler.
2. With a query hook, keeps the keyword in the component's own state (`useState`) and passes it as the `query` option, updating that state from the input; the query hook then executes when the debounced query changes (no explicit `autoExecute` needed — it defaults to `true`).
3. Renders the loading, result and error states.

FAIL if the answer does any of these:

- Hand-rolls the debounce with `setTimeout`/`useEffect` instead of a debounced hook.
- Uses options or return fields that 6.0 removed: `initialQuery`, a `setQuery` or `getQuery` returned by the hook, `propagateError`, or `run`/`cancel`/`isPending` on `useDebouncedQuery`/`useDebouncedFetcherQuery` (those return `pending` and `flush`).
