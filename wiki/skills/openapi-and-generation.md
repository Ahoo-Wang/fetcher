---
title: OpenAPI and generation
description: OpenAPI and generation — Fetcher agent workflows
pageClass: skills-page
---

# OpenAPI and generation

Choose a skill from the task’s inputs and outputs. An application can compose packages while keeping each change focused on one responsibility.

| Task              | Skill                                                                                                                    | API reference                                |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------- |
| OpenAPI types     | [`$fetcher-openapi-types`](https://github.com/Ahoo-Wang/fetcher/blob/main/skills/fetcher-openapi-types/SKILL.md)         | [openapi](../reference/openapi/index.md)     |
| Client generation | [`$fetcher-openapi-generator`](https://github.com/Ahoo-Wang/fetcher/blob/main/skills/fetcher-openapi-generator/SKILL.md) | [generator](../reference/generator/index.md) |

## Provide this context

Input document, output directory, tsconfig and expected client operations. Separate static OpenAPI modeling from generation. Require a real generation and output check; a guessed client name is not evidence.

## Review the result

Check public imports, complete examples, failures and cleanup. Run package tests or actual generation for the affected behavior; inspect component interactions in a browser. Type-checking does not prove server protocol compatibility.

[Installation and full catalog](./index.md)
