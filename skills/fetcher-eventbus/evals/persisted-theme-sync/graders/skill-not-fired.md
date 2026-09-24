---
type: tool_used
tool: Skill
input_match: '"skill"\s*:\s*"(?:[\w-]+:)?fetcher-eventbus"'
min: 0
max: 0
arm: both
---

The request belongs to $fetcher-storage, so $fetcher-eventbus must not load. Scored in both arms (`arm: both`): the without-skill arm passes trivially, so a negative case measures trigger precision, not a with/without delta. The case has no llm grader — only the skill under test is loaded, so the neighbouring skill's answer cannot be expected here.
