---
type: tool_used
tool: Skill
input_match: '"skill"\s*:\s*"(?:[\w-]+:)?fetcher-openapi-types"'
min: 0
max: 0
arm: both
---

Client generation is not in this repository any more (it moved to Wow's generator in 6.0; $fetcher-v6-migration covers the move), and $fetcher-openapi-types' description says it is not a client generator, so it must not load. Scored in both arms (`arm: both`): the without-skill arm passes trivially, so a negative case measures trigger precision, not a with/without delta. The case has no llm grader — only the skill under test is loaded, so the neighbouring skill's answer cannot be expected here.
