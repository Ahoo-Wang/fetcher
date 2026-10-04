---
type: tool_used
tool: Skill
input_match: '"skill"\s*:\s*"(?:[\w-]+:)?fetcher"'
min: 0
max: 0
arm: both
---

Plain `EventSource` in a page without Fetcher is not $fetcher's job, so it must not load. Scored in both arms (`arm: both`): the without-skill arm passes trivially, so a negative case measures trigger precision, not a with/without delta.
