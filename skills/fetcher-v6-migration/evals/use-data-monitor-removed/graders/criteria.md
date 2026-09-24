---
type: llm
weight: 1
---

Grade the final answer against $fetcher-v6-migration. Pass only if every point holds:

- Explains that the data-monitor hooks (`useDataMonitor`, `DataMonitorService`, `dataMonitorEventBus`, `DataChangedEvent`, …) were removed in 6.0 with no replacement.
- Offers the two options: delete the calls and the UI built on them, or keep every `@ahoo-wang/fetcher*` package on 5.x (`^5.1.3`).
- Does not invent a replacement package or hook.
- Invents no API: every `@ahoo-wang/*` import, class, function, option and constant it uses is one the skill documents (in `SKILL.md` or `references/api.md`). Fail the response if it relies on a symbol, option or package that does not exist.
