---
prev: false
title: Run complete examples
description: Run deterministic HTTP, React, Viewer, and View Engine examples with clear consumer and repository instructions.
---

# Run complete examples

Each example includes maintained source, prerequisites, run commands, expected results, and cleanup. The repository fixtures require no external backend.

| Example                         | Run it to observe                                                              | Use it in your application                                                     |
| ------------------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------ |
| [HTTP](./http.md)               | A local server returns Ada; a missing route produces HTTP 404                  | Copy the server and client into the independent ESM setup                      |
| [React](./react.md)             | Load, fail, start a delayed request, then cancel it                            | Mount the component in an existing React app and provide the documented routes |
| [Viewer](./viewer.md)           | Four rows, paging, name sorting, Active filtering, and saved-view confirmation | Mount the local component with compatible React/Viewer peers                   |
| [View Engine](./view-engine.md) | Three orders, manual queries, sorting and paging through ViewPage              | Use the current workspace or verified local archive in a React 19 application  |

The Viewer example saves to component memory and resets on remount. The React fixture's slow route takes 2000 ms so cancellation is visible. These checks prove the example behavior, not authentication, server consistency, or production persistence.

After running a baseline, choose a [development task](../guides/index.md) or inspect [resource ownership](../architecture/state-and-resources.md).
