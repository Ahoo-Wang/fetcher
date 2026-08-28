---
title: Fetcher Skills
description: Use Fetcher package-aware skills with Codex and other compatible coding agents.
pageClass: skills-page
---

# Fetcher Skills

Fetcher ships twelve task-focused agent skills. Each skill gives an agent a
bounded workflow, the relevant package boundary, and an API reference checked
against the public exports. Use them when you want an agent to implement with
Fetcher instead of rediscovering the ecosystem from scratch.

::: tip Skills complement the documentation
Use this site to understand and review an implementation. Use a skill when you
want an agent to perform the work with the right package and constraints.
:::

## Start in two minutes

Codex discovers repository skills from `.agents/skills`. From a Fetcher clone,
link the skills you want into that directory:

```bash
mkdir -p .agents/skills
ln -s ../../skills/fetcher-integration .agents/skills/fetcher-integration
ln -s ../../skills/fetcher-react-hooks .agents/skills/fetcher-react-hooks
```

Codex follows symlinked skill directories. Restart Codex only when a newly
added skill does not appear. See the
[official OpenAI Skills documentation](https://developers.openai.com/codex/skills/)
for supported locations and discovery behavior.

Invoke a skill explicitly with `$` in Codex CLI or the IDE extension:

```text
$fetcher-integration create a named client with a 10 second timeout,
JSON extraction, and a typed 401 recovery interceptor.
```

An agent may also select a skill automatically when the request matches its
description. Explicit invocation is better when the package boundary matters.

## Choose a skill

| Goal                                                             | Skill                        | Package reference                           |
| ---------------------------------------------------------------- | ---------------------------- | ------------------------------------------- |
| Configure requests, URLs, interceptors, timeouts, and extraction | `$fetcher-integration`       | [Fetcher](../reference/fetcher.md)          |
| Declare typed service classes                                    | `$fetcher-decorator-service` | [Decorator](../reference/decorator.md)      |
| Coordinate typed local or cross-tab events                       | `$fetcher-eventbus`          | [Event bus](../reference/eventbus.md)       |
| Persist typed browser or in-memory state                         | `$fetcher-storage`           | [Storage](../reference/storage.md)          |
| Consume SSE and token streams                                    | `$fetcher-llm-streaming`     | [Event stream](../reference/eventstream.md) |
| Call OpenAI chat and streaming APIs                              | `$fetcher-openai-client`     | [OpenAI](../reference/openai.md)            |
| Model OpenAPI 3 documents in TypeScript                          | `$fetcher-openapi-types`     | [OpenAPI](../reference/openapi.md)          |
| Generate clients from OpenAPI                                    | `$fetcher-openapi-generator` | [Generator](../reference/generator.md)      |
| Build request state with React hooks                             | `$fetcher-react-hooks`       | [React](../reference/react.md)              |
| Build data exploration interfaces                                | `$fetcher-viewer-components` | [Viewer](../reference/viewer.md)            |
| Add CoSec authentication and token refresh                       | `$fetcher-cosec-auth`        | [CoSec](../reference/cosec.md)              |
| Build Wow command and query clients                              | `$fetcher-wow-cqrs`          | [Wow](../reference/wow.md)                  |

## How each skill is structured

Every Fetcher skill has three layers:

| File                 | Loaded when                | Purpose                                        |
| -------------------- | -------------------------- | ---------------------------------------------- |
| `SKILL.md`           | The skill activates        | Trigger boundary and implementation workflow   |
| `references/api.md`  | Exact API detail is needed | Signatures, defaults, examples, and edge cases |
| `agents/openai.yaml` | The host lists the skill   | Display name and default prompt                |

The short workflow prevents unrelated packages from entering a change. The API
reference is intentionally deeper than the public Wiki page and remains the
agent-facing source for exact signatures.

## Prompt pattern

Give the agent a concrete outcome and constraints:

```text
$fetcher-openapi-generator generate a client from ./openapi.yaml.
Keep generated code under src/generated, use the existing tsconfig,
and verify the generated package builds without editing the specification.
```

Include runtime, error, authentication, or compatibility constraints that
change the implementation. Do not paste API signatures that the skill can load
from its own reference.

## Browse by workflow

- [HTTP and services](./http-and-services.md)
- [Streaming and OpenAI](./streaming-and-openai.md)
- [OpenAPI and generation](./openapi-and-generation.md)
- [React and integrations](./react-and-integrations.md)
