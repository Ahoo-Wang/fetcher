---
title: Streaming and OpenAI
description: Streaming and OpenAI — Fetcher agent workflows
pageClass: skills-page
---

# Streaming and OpenAI

Choose a skill from the task’s inputs and outputs. An application can compose packages while keeping each change focused on one responsibility.

| Task             | Skill                                                                                                            | API reference                                    |
| ---------------- | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| SSE consumption  | [`$fetcher-llm-streaming`](https://github.com/Ahoo-Wang/fetcher/blob/main/skills/fetcher-llm-streaming/SKILL.md) | [eventstream](../reference/eventstream/index.md) |
| Chat completions | [`$fetcher-openai-client`](https://github.com/Ahoo-Wang/fetcher/blob/main/skills/fetcher-openai-client/SKILL.md) | [openai](../reference/openai/index.md)           |

## Provide this context

Response content type, a sample SSE frame, raw termination marker, expected JSON shape, cancellation owner and server/browser boundary. For chat, identify the compatible endpoint and model supplied by your application.

## Review the result

Check public imports, complete examples, failures and cleanup. Run package tests or actual generation for the affected behavior; inspect component interactions in a browser. Type-checking does not prove server protocol compatibility.

[Installation and full catalog](./index.md)
