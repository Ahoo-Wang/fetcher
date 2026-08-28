---
title: Fetcher Skills
description: Use Fetcher package-aware skills with Codex and other compatible coding agents.
pageClass: skills-page
---

# Fetcher Skills

Fetcher maintains twelve task-focused Agent Skills in this repository and
publishes them together as the `ahoo-fetcher-skills` plugin through the
[Ahoo Skills marketplace](https://github.com/Ahoo-Wang/skills). One plugin
install gives an agent the package boundaries, workflows, and API references
for the full Fetcher ecosystem.

::: tip Skills complement the documentation
Use this site to understand and review an implementation. Use a skill when you
want an agent to perform the work with the right package and constraints.
:::

## Install the Fetcher plugin

[Ahoo Skills](https://github.com/Ahoo-Wang/skills) is the central distribution
repository. It publishes one split plugin per source project; Fetcher's plugin
is `ahoo-fetcher-skills`.

### Codex

```bash
codex plugin marketplace add Ahoo-Wang/skills --ref main
codex plugin add ahoo-fetcher-skills@ahoo-skills
```

### Claude Code

```bash
/plugin marketplace add https://github.com/Ahoo-Wang/skills
/plugin install ahoo-fetcher-skills
```

The marketplace syncs source repositories every six hours and turns each sync
commit into a new plugin version. In Claude Code, run `/plugin update` to pull
the latest synchronized copy. These installation and update rules come from
the [Ahoo Skills installation guide](https://github.com/Ahoo-Wang/skills/blob/main/README.md#L47-L66).

## Invoke a skill

After installing the plugin, invoke one of its skills explicitly with `$`:

```text
$fetcher-integration create a named client with a 10 second timeout,
JSON extraction, and a typed 401 recovery interceptor.
```

An agent may also select a skill automatically when the request matches its
description. Explicit invocation is better when the package boundary matters.

## Source and distribution

| Layer        | Location                                                                                                             | Purpose                                           |
| ------------ | -------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| Source       | [`fetcher/skills`](https://github.com/Ahoo-Wang/fetcher/tree/main/skills)                                            | Author and review Fetcher-owned skill content     |
| Distribution | [`plugins/ahoo-fetcher-skills`](https://github.com/Ahoo-Wang/skills/tree/main/plugins/ahoo-fetcher-skills)           | Generated plugin consumed by agents               |
| Marketplace  | [`.agents/plugins/marketplace.json`](https://github.com/Ahoo-Wang/skills/blob/main/.agents/plugins/marketplace.json) | Advertise the installable Codex plugin collection |

Edit skills in Fetcher, not in the generated distribution copy. Ahoo Skills
shallow-clones this repository, mirrors `skills/plugins.json`, and regenerates
the plugin on its sync schedule. The central repository documents that flow in
its [source synchronization description](https://github.com/Ahoo-Wang/skills/blob/main/README.md#L68-L80).

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

Every Fetcher skill has three core layers; some also include `evals/` fixtures:

| File                 | Loaded when                | Purpose                                        |
| -------------------- | -------------------------- | ---------------------------------------------- |
| `SKILL.md`           | The skill activates        | Trigger boundary and implementation workflow   |
| `references/api.md`  | Exact API detail is needed | Signatures, defaults, examples, and edge cases |
| `agents/openai.yaml` | The host lists the skill   | Display name and default prompt                |
| `evals/`             | The skill is validated     | Optional activation or behavior fixtures       |

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
