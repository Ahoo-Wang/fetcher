---
type: llm
weight: 1
---

Grade the final answer against $fetcher-v6-migration. Pass only if every point holds:

- Runs or tells the user to run `npm view @ahoo-wang/wow-client version` (and `npm view @ahoo-wang/fetcher dist-tags`) before proposing any install.
- Does not tell the user to install `@ahoo-wang/wow-*` or add it to package.json without that `npm view` check; it must not claim those packages are on npm.
- If they are not published: recommends staying on 5.x, pinning `@ahoo-wang/fetcher-react@5.1.3`, and lists what will change later.
- If they are published: replaces `@ahoo-wang/fetcher-wow` with `@ahoo-wang/wow-client`, imports `usePagedQuery` from `@ahoo-wang/wow-react`, keeps `useFetcher` in `@ahoo-wang/fetcher-react`, then bumps the fetcher packages to `^6`.
- Invents no API: every `@ahoo-wang/*` import, class, function, option and constant it uses is one the skill documents (in `SKILL.md` or `references/api.md`). Fail the response if it relies on a symbol, option or package that does not exist.
