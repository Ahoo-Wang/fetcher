---
type: tool_used
tool: Skill
input_match: '"skill"\s*:\s*"(?:[\w-]+:)?fetcher-decorator-service"'
min: 0
max: 0
arm: both
---

A direct call whose URL is built at runtime belongs to $fetcher-integration (its description and $fetcher-decorator-service's both say so), so $fetcher-decorator-service must not load. Scored in both arms (`arm: both`): the without-skill arm passes trivially, so a negative case measures trigger precision, not a with/without delta. The case has no llm grader — only the skill under test is loaded, so the neighbouring skill's answer cannot be expected here.
