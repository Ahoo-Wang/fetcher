---
type: llm
weight: 1
---

Judge only the agent's final answer. It worked in an empty, read-only directory, so ignore that it wrote no files, could not find the user's code, hedged, or asked follow-up questions: grade the code and explanation it gave. Accept any wording and any equivalent code.

PASS only if the answer does all of these:

1. Its grep commands cover the removed packages (`fetcher-wow`, `fetcher-generator`, `fetcher-viewer`), the removed Wow query hooks and the data-monitor hooks.
2. It says what a hit means: stay on 5.x, or move to the Wow packages once they are published.

FAIL if the answer does any of these:

- Treats `useFetcher`, `useFetcherQuery` or `useQuery` as removed in 6.0.
- Tells the user to install an `@ahoo-wang/wow-*` package without checking `npm view` first.
