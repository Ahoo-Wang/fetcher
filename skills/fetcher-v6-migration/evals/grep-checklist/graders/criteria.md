---
type: llm
weight: 1
---

Judge only the agent's final answer. It worked in an empty, read-only directory, so ignore that it wrote no files, could not find the user's code, hedged, or asked follow-up questions: grade the code and explanation it gave. Accept any wording and any equivalent code.

PASS only if the answer does all of these:

1. Its grep commands cover the removed packages (`fetcher-wow`, `fetcher-generator`, `fetcher-viewer`), the removed Wow query hooks and the data-monitor hooks.
2. It says what a hit means: `fetcher-wow`, `fetcher-generator` and Wow query hooks → switch to the Wow packages (9.2.1 or later) before upgrading fetcher; `fetcher-viewer` and data-monitor hooks → stay on 5.x (or drop/replace that usage).
3. It also covers the `@ahoo-wang/fetcher-react` API that 6.0's redesign removed or changed (at least `propagateError` and `initialQuery`/`setQuery` on query hooks), saying those hits are rewritten rather than reasons to stay on 5.x.

FAIL if the answer does any of these:

- Treats `useFetcher`, `useFetcherQuery` or `useQuery` as removed in 6.0.
- Tells the user to install an `@ahoo-wang/wow-*` package without checking `npm view` first, or claims the Wow packages are not on npm.
