---
type: llm
weight: 1
---

Judge only the agent's final answer. It worked in an empty, read-only directory, so ignore that it wrote no files, could not find the user's code, hedged, or asked follow-up questions: grade the code and explanation it gave. Accept any wording and any equivalent code.

PASS only if the answer does all of these:

1. Moves the query into the component's own state (`const [query, setQuery] = useState({ keyword: '' })`) and passes it to `useQuery` as `query`, dropping `initialQuery` and the hook-returned `setQuery`.
2. Changes the `execute` option to `(query, abortController) => …` (no `attributes` parameter).
3. Drops `propagateError` and the `try/catch`: reads `{ status, error }` from what `await execute()` resolves to and branches on `status` (`'success'` / `'error'`), because `execute` never rejects in 6.0.

FAIL if the answer does any of these:

- Keeps `initialQuery`, `propagateError`, or a `setQuery`/`getQuery` returned by `useQuery`, or suggests `useQueryState`.
- Tells the user to stay on 5.x or downgrade as the fix for this code.
