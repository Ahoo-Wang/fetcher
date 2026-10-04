---
title: HTTP and services
description: HTTP and services — Fetcher agent workflows
pageClass: skills-page
---

# HTTP and services

Choose a skill from the task’s inputs and outputs. An application can compose packages while keeping each change focused on one responsibility.

| Task                 | Skill                                                                                               | API reference                                |
| -------------------- | --------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| HTTP clients         | [`$fetcher`](https://github.com/Ahoo-Wang/fetcher/blob/main/skills/fetcher/references/client.md)    | [fetcher](../reference/fetcher/index.md)     |
| Declarative services | [`$fetcher`](https://github.com/Ahoo-Wang/fetcher/blob/main/skills/fetcher/references/decorator.md) | [decorator](../reference/decorator/index.md) |
| Event delivery       | [`$fetcher`](https://github.com/Ahoo-Wang/fetcher/blob/main/skills/fetcher/references/state.md)     | [eventbus](../reference/eventbus/index.md)   |
| Stored values        | [`$fetcher`](https://github.com/Ahoo-Wang/fetcher/blob/main/skills/fetcher/references/state.md)     | [storage](../reference/storage/index.md)     |

## Provide this context

Base URL, existing named/direct Fetcher, request and response shapes, header ownership, timeout and cancellation requirements. For events or storage, specify lifetime and whether other tabs must participate.

## Review the result

Check public imports, complete examples, failures and cleanup. Run package tests or actual generation for the affected behavior; inspect component interactions in a browser. Type-checking does not prove server protocol compatibility.

[Installation and full catalog](./index.md)
