---
type: llm
weight: 1
---

Grade the final answer against $fetcher-openapi-types. Pass only if every point holds:

- Narrows `Schema | Reference` with a type guard on `$ref`.
- Looks the schema up in `components.schemas` by the name taken from the `$ref`.
- Warns not to apply that guard to `PathItem`, which has its own `$ref` field.
- Invents no API: every `@ahoo-wang/*` import, class, function, option and constant it uses is one the skill documents (in `SKILL.md` or `references/api.md`). Fail the response if it relies on a symbol, option or package that does not exist.
