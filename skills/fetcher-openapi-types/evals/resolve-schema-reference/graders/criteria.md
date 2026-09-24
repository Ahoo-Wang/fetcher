---
type: llm
weight: 1
---

Judge only the agent's final answer. It worked in an empty, read-only directory, so ignore that it wrote no files, could not find the user's code, hedged, or asked follow-up questions: grade the code and explanation it gave. Accept any wording and any equivalent code.

PASS only if the answer does all of these:

1. Narrows `Schema | Reference` with a type guard on `$ref`.
2. Looks the schema up in `components.schemas` by the name taken from the `$ref` (`#/components/schemas/<Name>`).
3. Warns not to use that `$ref` check on a `PathItem`, which has its own `$ref` field.

FAIL if the answer does any of these:

- Imports a `$ref` resolver from `@ahoo-wang/fetcher-openapi`; the package has none.
