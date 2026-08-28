---
title: HTTP and service skills
description: Choose Fetcher skills for direct requests, declarative services, typed events, and storage.
pageClass: skills-page
---

# HTTP and service skills

These four skills cover the foundation packages. Start with direct Fetcher
requests; add a higher-level skill only when the application owns that
responsibility.

## `$fetcher-integration`

**Use for:** `Fetcher`, `NamedFetcher`, request options, URL parameters,
interceptors, result extraction, cancellation, timeout, and status validation.

**Do not use for:** decorator metadata, React state, generated clients, or an
authentication protocol that already has its own skill.

```text
$fetcher-integration add a reusable NamedFetcher for the billing API.
Return typed JSON, time out after 8 seconds, and preserve response context
when status validation fails.
```

The skill keeps the request lifecycle explicit and directs exact signature
questions to
[`skills/fetcher-integration/references/api.md`](https://github.com/Ahoo-Wang/fetcher/blob/main/skills/fetcher-integration/references/api.md).

Continue with the [Fetcher reference](../reference/fetcher.md).

## `$fetcher-decorator-service`

**Use for:** class-based services built with `@api`, HTTP method decorators,
parameter decorators, lifecycle hooks, and generated decorator metadata.

`reflect-metadata` ships with the package and is imported automatically. Add an
explicit application entry-point import only when another decorator library
must initialize it before Fetcher services load.

```text
$fetcher-decorator-service define a UserService with typed get, create,
and delete endpoints. Use an existing NamedFetcher and support AbortSignal.
```

Use `$fetcher-integration` first when the real task is configuring the shared
client rather than declaring service methods.

Continue with the [Decorator reference](../reference/decorator.md).

## `$fetcher-eventbus`

**Use for:** serial, parallel, and broadcast delivery; handler lifecycle; named
events; and cross-tab messenger selection.

```text
$fetcher-eventbus publish a typed SessionExpired event across tabs.
Use the built-in fallback chain and return a cleanup function.
```

Choose delivery semantics from observable behavior: serial preserves handler
order, parallel minimizes total wait, and broadcast crosses browser contexts.

Continue with the [Event bus reference](../reference/eventbus.md).

## `$fetcher-storage`

**Use for:** typed values backed by browser storage or `InMemoryStorage`,
serialization, default values, listeners, and cross-tab synchronization.

```text
$fetcher-storage persist the selected workspace as typed JSON.
Use an in-memory fallback for non-browser rendering and clean up listeners.
```

The skill distinguishes storage persistence from event delivery. Use
`$fetcher-eventbus` when the message itself—not the stored value—is the domain
event.

Continue with the [Storage reference](../reference/storage.md).
