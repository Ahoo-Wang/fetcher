---
type: llm
weight: 1
---

Grade the final answer against $fetcher-v6-migration. Pass only if every point holds:

- Gives grep patterns for manifests and lockfiles (`fetcher-wow`, `fetcher-generator`, `fetcher-viewer`).
- Covers imports of the moved packages, the Wow query hooks (`use(Fetcher)?(Single|List|Paged|Count|ListStream)Query` and their Options/Return types) without matching `useFetcherQuery`, the data-monitor symbols, and the `fetcher-generator` command in scripts and CI.
- Maps each kind of hit to "stay on 5.x" or "rewrite".
- Invents no API: every `@ahoo-wang/*` import, class, function, option and constant it uses is one the skill documents (in `SKILL.md` or `references/api.md`). Fail the response if it relies on a symbol, option or package that does not exist.
