---
next: false
title: Clean up React async work
description: Connect cancellation to the actual operation and distinguish abort, reset, and debounce cancellation.
---

# Clean up React async work

## Prerequisites

Run the [complete React example](../../examples/react.md) first. Its slow fixture gives you 2000 ms to cancel and its play check waits beyond that duration to detect late results. For a custom Promise, the operation must accept the controller; state protection alone cannot stop external work.

## Give the hook the real cancellation path

`useFetcher` supplies its owned controller to the Fetcher request. If you instead use `useExecutePromise`, forward the supplied signal yourself:

```tsx
const work = useExecutePromise<string>();
const load = () =>
  work.execute(async controller => {
    const response = await fetch('/api/message', { signal: controller.signal });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.text();
  });
```

Import `useExecutePromise` from `@ahoo-wang/fetcher-react` and put these lines inside your component. Bind `load` to Load, `work.abort` to Cancel, and render `work.loading`, `work.error`, and `work.result` as in [the complete request component](../../examples/react.md). This alternative requires `GET /api/message` returning plain text; the repository fixture does not provide it.

## Use the correct cleanup action

| Action                    | What it does                                                   | Use it for                         |
| ------------------------- | -------------------------------------------------------------- | ---------------------------------- |
| `abort()`                 | Invalidates and aborts the active execution, returning to idle | Stop or cancel an active operation |
| `reset()`                 | Sets state to idle without invalidating/aborting active work   | Clear a settled presentation state |
| Debounced hook `cancel()` | Removes pending scheduling                                     | Prevent a queued invocation        |
| Component unmount         | Cleans up hook-owned execution and debounce timers             | End the component's work           |

A new execution aborts its predecessor; the request sequence and mounted check suppress stale state updates. A custom promise that ignores its controller may still finish externally. A Stop button for a debounced request needs both cancel and abort. Use a fresh execution/controller for another attempt.

## Verify cancellation rather than just a cleared screen

Start the slow example, cancel it, then wait longer than 2000 ms: it should stay idle. Repeat by unmounting the component before completion and checking the replacement screen stays unchanged. A call to reset during an active request is not an equivalent test, because that request may subsequently publish success.

Catch operation failures at the state or promise boundary according to `propagateError`. Native AbortError cancellation returns to idle; do not invent a successful data result for it. Clear any timers and external listeners you created outside the hook separately. SSR identity and shared-client isolation remain application responsibilities.

See [promise lifecycle](../../reference/react/promise-and-query-state.md), [HTTP cancellation](../http/cancellation.md), and [state and resources](../../architecture/state-and-resources.md).
