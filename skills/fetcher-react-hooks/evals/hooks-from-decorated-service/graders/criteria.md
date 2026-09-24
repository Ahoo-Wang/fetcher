---
type: llm
weight: 1
---

Grade the final answer against $fetcher-react-hooks. Pass only if every point holds:

- Uses `createQueryApiHooks({ api: userService })` and/or `createExecuteApiHooks({ api: userService })` to produce `use<Method>` hooks such as `useGetUser`/`useUpdateUser`.
- Notes that execute hooks do not forward the `AbortController` to the service method.
- Invents no API: every `@ahoo-wang/*` import, class, function, option and constant it uses is one the skill documents (in `SKILL.md` or `references/api.md`). Fail the response if it relies on a symbol, option or package that does not exist.
