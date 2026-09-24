---
type: llm
weight: 1
---

Grade the final answer against $fetcher-cosec-auth. Pass only if every point holds:

- Identifies the cause: the refresh request goes through the same fetcher, so the auth interceptors try to refresh it again.
- Fixes it by sending the refresh request with `attributes: new Map([[IGNORE_REFRESH_TOKEN_ATTRIBUTE_KEY, true]])`, or by switching to `CoSecTokenRefresher`, which already sets that attribute.
- Invents no API: every `@ahoo-wang/*` import, class, function, option and constant it uses is one the skill documents (in `SKILL.md` or `references/api.md`). Fail the response if it relies on a symbol, option or package that does not exist.
