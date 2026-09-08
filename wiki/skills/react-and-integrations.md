---
title: React and integrations
description: React and integrations — Fetcher agent workflows
pageClass: skills-page
---

# React and integrations

Choose a skill from the task’s inputs and outputs. An application can compose packages while keeping each change focused on one responsibility.

| Task                     | Skill                                                                                                                    | API reference                          |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------ | -------------------------------------- |
| React request state      | [`$fetcher-react-hooks`](https://github.com/Ahoo-Wang/fetcher/blob/main/skills/fetcher-react-hooks/SKILL.md)             | [react](../reference/react/index.md)   |
| Data viewers             | [`$fetcher-viewer-components`](https://github.com/Ahoo-Wang/fetcher/blob/main/skills/fetcher-viewer-components/SKILL.md) | [viewer](../reference/viewer/index.md) |
| CoSec authentication     | [`$fetcher-cosec-auth`](https://github.com/Ahoo-Wang/fetcher/blob/main/skills/fetcher-cosec-auth/SKILL.md)               | [cosec](../reference/cosec/index.md)   |
| Wow commands and queries | [`$fetcher-wow-cqrs`](https://github.com/Ahoo-Wang/fetcher/blob/main/skills/fetcher-wow-cqrs/SKILL.md)                   | [wow](../reference/wow/index.md)       |

## Provide this context

Component-owned state, query triggers, API clients, authentication/tenant context, persistence callbacks and failure UI. Use the existing Viewer contract only when the backend supports it; do not turn an ordinary REST endpoint into a guessed Wow endpoint.

## Review the result

Check public imports, complete examples, failures and cleanup. Run package tests or actual generation for the affected behavior; inspect component interactions in a browser. Type-checking does not prove server protocol compatibility.

[Installation and full catalog](./index.md)
