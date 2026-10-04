---
type: llm
weight: 1
---

Judge only the agent's final answer. It worked in an empty, read-only directory, so ignore that it wrote no files, could not find the user's code, hedged, or asked follow-up questions: grade the code and explanation it gave. Accept any wording and any equivalent code.

PASS only if the answer does all of these:

1. Checks (or tells the user to check) the current `@ahoo-wang/wow-client` / `@ahoo-wang/wow-react` version or peer range with `npm view` before proposing an install.
2. Orders the upgrade: move the fetcher packages to the latest 5.x (5.1.3 or later; `^5.1.5` satisfies the Wow peer range), switch from `@ahoo-wang/fetcher-wow` to the Wow packages (`@ahoo-wang/wow-client`, `@ahoo-wang/wow-react`) at 9.2.1 or later first, then upgrade the fetcher packages to 6; and says `usePagedQuery` moves to `@ahoo-wang/wow-react` while `useFetcher` stays in `@ahoo-wang/fetcher-react`.

FAIL if the answer does any of these:

- Adds an `@ahoo-wang/wow-*` package without the `npm view` check, pins it below 9.2.1 or to an invented version, or claims the Wow packages are not on npm.
- Upgrades `@ahoo-wang/fetcher-react` to 6 while `usePagedQuery` is still imported from it.
