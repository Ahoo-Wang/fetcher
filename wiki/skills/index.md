---
prev: false
title: Use Fetcher Skills
description: Use Fetcher Skills — Fetcher agent workflows
pageClass: skills-page
---

# Use Fetcher Skills

Skills give a coding agent package boundaries, implementation workflows, and API references. This documentation helps you understand and review the result; a skill helps the agent perform the work within those boundaries.

## Install the plugin

Fetcher’s skills/plugins.json publishes these skills as ahoo-fetcher-skills. Follow the [Ahoo Skills installation guide](https://github.com/Ahoo-Wang/skills#installation) for the matching plugin.

```bash
codex plugin marketplace add Ahoo-Wang/skills --ref main
codex plugin add ahoo-fetcher-skills@ahoo-skills
```

Claude Code uses `/plugin marketplace add https://github.com/Ahoo-Wang/skills` followed by `/plugin install ahoo-fetcher-skills`. Distribution controls the installed version; do not assume it immediately matches repository HEAD.

## Choose the task boundary

| Task                     | Skill                                                                                                                    | API reference                                    |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------ |
| HTTP clients             | [`$fetcher-integration`](https://github.com/Ahoo-Wang/fetcher/blob/main/skills/fetcher-integration/SKILL.md)             | [fetcher](../reference/fetcher/index.md)         |
| Declarative services     | [`$fetcher-decorator-service`](https://github.com/Ahoo-Wang/fetcher/blob/main/skills/fetcher-decorator-service/SKILL.md) | [decorator](../reference/decorator/index.md)     |
| Event delivery           | [`$fetcher-eventbus`](https://github.com/Ahoo-Wang/fetcher/blob/main/skills/fetcher-eventbus/SKILL.md)                   | [eventbus](../reference/eventbus/index.md)       |
| Stored values            | [`$fetcher-storage`](https://github.com/Ahoo-Wang/fetcher/blob/main/skills/fetcher-storage/SKILL.md)                     | [storage](../reference/storage/index.md)         |
| SSE consumption          | [`$fetcher-llm-streaming`](https://github.com/Ahoo-Wang/fetcher/blob/main/skills/fetcher-llm-streaming/SKILL.md)         | [eventstream](../reference/eventstream/index.md) |
| Chat completions         | [`$fetcher-openai-client`](https://github.com/Ahoo-Wang/fetcher/blob/main/skills/fetcher-openai-client/SKILL.md)         | [openai](../reference/openai/index.md)           |
| OpenAPI types            | [`$fetcher-openapi-types`](https://github.com/Ahoo-Wang/fetcher/blob/main/skills/fetcher-openapi-types/SKILL.md)         | [openapi](../reference/openapi/index.md)         |
| Client generation        | [`$fetcher-openapi-generator`](https://github.com/Ahoo-Wang/fetcher/blob/main/skills/fetcher-openapi-generator/SKILL.md) | [generator](../reference/generator/index.md)     |
| React request state      | [`$fetcher-react-hooks`](https://github.com/Ahoo-Wang/fetcher/blob/main/skills/fetcher-react-hooks/SKILL.md)             | [react](../reference/react/index.md)             |
| Data viewers             | [`$fetcher-viewer-components`](https://github.com/Ahoo-Wang/fetcher/blob/main/skills/fetcher-viewer-components/SKILL.md) | [viewer](../reference/viewer/index.md)           |
| CoSec authentication     | [`$fetcher-cosec-auth`](https://github.com/Ahoo-Wang/fetcher/blob/main/skills/fetcher-cosec-auth/SKILL.md)               | [cosec](../reference/cosec/index.md)             |
| Wow commands and queries | [`$fetcher-wow-cqrs`](https://github.com/Ahoo-Wang/fetcher/blob/main/skills/fetcher-wow-cqrs/SKILL.md)                   | [wow](../reference/wow/index.md)                 |

## Ask for a verifiable outcome

```text
$fetcher-openapi-generator generate from ./openapi.yaml into src/generated.
Use the existing tsconfig, preserve the input contract, and type-check the output.
```

Provide inputs, output location, existing clients, runtime, and acceptance criteria. A skill’s references/api.md supplies detailed material on demand; human Reference pages also provide accurate contracts without requiring readers to switch to a skill to develop an application.

Author source files under this repository’s skills/. Ahoo Skills generates distribution copies; change and validate the source rather than editing generated copies.

Start with [runnable examples](../examples/index.md) and [task guides](../guides/index.md) to give the agent concrete inputs and expected results. Use [architecture](../architecture/index.md) to review boundaries.
