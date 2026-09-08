---
title: Trigger and display a React request
description: Use the verified useFetcher component to render loading, results, errors, and cancellation.
---

# Trigger and display a React request

## Prerequisites

Use an existing React application with the installation and entry file in [the complete React example](../../examples/react.md). For a backend-free check, run that page's Storybook command. Its controlled service returns a user array, an HTTP 500 error, and a slow result delayed by 2000 ms.

## Mount the complete component

Follow [Run the verified fixture](../../examples/react.md#run-the-verified-fixture), or copy `ReactRequests.tsx` and mount `<ReactRequests />` using the consumer instructions on the same page. The maintained file is the complete implementation; keep request behavior there instead of duplicating it in wrappers.

The component memoizes its `Fetcher` by `baseURL`, calls `useFetcher` with an explicit JSON extractor, and binds each button to `execute({ url })`. The application reads `result`, `error`, `loading`, and `status` from the hook. `execute()` returns `Promise<void>`, not the user data.

## Check each visible state

1. Click **Load**. The request enters loading, then renders **Ada, Lin** in the repository fixture.
2. Click **Fail**. The non-2xx response renders an error instead of a successful user result.
3. Click **Load slow**, then **Cancel** before 2000 ms. The hook returns to idle. Wait beyond the delay and verify that no late `completed` result replaces it.
4. Click **Load** again to verify that a new attempt works after cancellation.

In your own application, `/api/users` must return a JSON user array, `/api/error` a non-2xx response, and `/api/slow` a delayed JSON object `{ "status": "completed" }`. Those are demonstration routes you must supply; the hook does not create them.

## Handle errors and cleanup

By default execution errors populate hook state instead of rethrowing. If you enable `propagateError`, also handle the returned promise's rejection. A new execution cancels its predecessor and only the latest mounted execution can publish state. Unmount cleans up the owned request. These protections do not provide a global query cache or undo work already performed by a server.

Continue with [input-driven queries](./queries.md), [cleanup](./cleanup.md), [hook reference](../../reference/react/fetcher-hooks.md), and [state ownership](../../architecture/state-and-resources.md).
