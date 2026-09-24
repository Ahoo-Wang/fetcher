---
type: llm
weight: 1
---

Judge only the agent's final answer. It worked in an empty, read-only directory, so ignore that it wrote no files, could not find the user's code, hedged, or asked follow-up questions: grade the code and explanation it gave. Accept any wording and any equivalent code.

PASS only if the answer does all of these:

1. Checks (or tells the user to check) with `npm view` whether `@ahoo-wang/wow-client` is published before proposing any install.
2. Recommends staying on 5.x with `@ahoo-wang/fetcher-react` at 5.1.3 while the Wow packages are unpublished, and says `usePagedQuery` moves to `@ahoo-wang/wow-react` while `useFetcher` stays in `@ahoo-wang/fetcher-react`.

FAIL if the answer does any of these:

- Adds an `@ahoo-wang/wow-*` package to package.json or installs it without the `npm view` check, or claims it is on npm.
