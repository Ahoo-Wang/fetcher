---
type: llm
weight: 1
---

Judge only the agent's final answer. It worked in an empty, read-only directory, so ignore that it wrote no files, could not find the user's code, hedged, or asked follow-up questions: grade the code and explanation it gave. Accept any wording and any equivalent code.

PASS only if the answer does all of these:

1. Uses a debounced hook from `@ahoo-wang/fetcher-react` (`useDebouncedFetcherQuery`, or `useDebouncedFetcher`/`useDebouncedQuery`) with `debounce: { delay: 300 }`.
2. Makes it run as the user types: with a query hook, sets `autoExecute: true` explicitly and updates the keyword with `setQuery`; or calls the hook's `run(...)` from the input handler.
3. Renders the loading, result and error states.

FAIL if the answer does any of these:

- Hand-rolls the debounce with `setTimeout`/`useEffect` instead of a debounced hook.
- Uses a debounced query hook without `autoExecute: true` and without calling `run`, expecting it to fire on input.
