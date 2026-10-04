---
type: tool_used
tool: Skill
input_match: '"skill"\s*:\s*"(?:[\w-]+:)?fetcher-v6-migration"'
min: 0
max: 0
arm: both
---

New code on Fetcher 6 is $fetcher's job, not an upgrade, so $fetcher-v6-migration must not load. Scored in both arms (`arm: both`): the without-skill arm passes trivially, so a negative case measures trigger precision, not a with/without delta.
