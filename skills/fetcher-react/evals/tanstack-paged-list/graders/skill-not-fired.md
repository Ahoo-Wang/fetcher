---
type: tool_used
tool: Skill
input_match: '"skill"\s*:\s*"(?:[\w-]+:)?fetcher-react"'
min: 0
max: 0
arm: both
---

The app uses TanStack Query, not Fetcher, so $fetcher-react must not load. Scored in both arms (`arm: both`): the without-skill arm passes trivially, so a negative case measures trigger precision, not a with/without delta.
