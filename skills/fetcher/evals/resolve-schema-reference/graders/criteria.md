---
type: llm
weight: 1
---

Judge only the agent's final answer. It worked in an empty, read-only directory, so ignore that it wrote no files, could not find the user's code, hedged, or asked follow-up questions: grade the code and explanation it gave. Accept any wording and any equivalent code.

PASS only if the answer does all of these:

1. Narrows `Schema | Reference` with a type guard on `$ref`.
2. Looks the schema up in `components.schemas` by the name taken from the `$ref` (`#/components/schemas/<Name>`).
3. Handles a component that is itself a `$ref` (resolves in a loop or recursively) or a `$ref` whose target is missing, instead of assuming one lookup always yields a `Schema`.

FAIL if the answer does any of these:

- Imports a `$ref` resolver from `@ahoo-wang/fetcher-openapi`; the package has none.
