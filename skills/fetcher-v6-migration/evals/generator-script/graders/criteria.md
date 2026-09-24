---
type: llm
weight: 1
---

Judge only the agent's final answer. It worked in an empty, read-only directory, so ignore that it wrote no files, could not find the user's code, hedged, or asked follow-up questions: grade the code and explanation it gave. Accept any wording and any equivalent code.

PASS only if the answer does all of these:

1. Says `@ahoo-wang/fetcher-generator` became `@ahoo-wang/wow-generator` (command `wow-generator`).
2. Says to check with `npm view` whether the Wow packages are published before installing anything.
3. Says the generated code must be regenerated (it then imports `@ahoo-wang/wow-client`) or its `@ahoo-wang/fetcher-wow` import rewritten.

FAIL if the answer does any of these:

- Tells the user to install an `@ahoo-wang/wow-*` package without the `npm view` check, or states a version for one.
