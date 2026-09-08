---
title: Runnable React request example
description: Exercise successful, failed, and cancelled Fetcher requests with real React hook state.
---

# Runnable React request example

This component uses a stable `Fetcher` instance and the real `useFetcher` hook. It renders the hook's `idle`, `loading`, `success`, and `error` states; `abort()` returns an active request to `idle`, so the example does not invent a separate cancelled state.

<<< @/../stories/docs/ReactRequests.tsx

`execute()` resolves to `void`; read data from `result`. `reset()` only clears state, while `abort()` also invalidates and aborts the active request. See the [Fetcher hook reference](../reference/react/fetcher-hooks.md) and the [React integration task guide](../skills/react-and-integrations.md).

## Run the verified fixture

Contributors need Node `>=20.20.2`, pnpm `10.34.5`, and the repository dependencies installed. From the repository root, run:

```bash
pnpm exec vitest run --project=storybook stories/docs/ReactRequests.stories.tsx
```

To try the same interactions manually, run `pnpm storybook`, open the printed local URL, and select **Docs / React requests** in the sidebar. The repository Storybook is the no-backend runnable example.

The Storybook fixture intercepts `fetch` for `https://api.example.test`: `/users` returns Ada and Lin, `/error` returns HTTP 500, and the documentation's `/slow` request resolves after 2000 ms unless its AbortSignal fires. Other existing stories keep the fixture's 80 ms default. Each story restores the previous global `fetch` afterward. The play tests assert the rendered result or error, then wait past the slow response before confirming that an aborted request did not publish a late success. This fixture proves browser-side state transitions; it does not prove compatibility with your API.

## Use it in a Vite application

The consumer setup below assumes an existing React + TypeScript Vite application. This repository is validated with Node `>=20.20.2`, pnpm `10.34.5`, Vite `^8.2.2`, TypeScript `^6.0.3`, and React/React DOM `^19.2.8`. The published Fetcher packages themselves declare Node `>=18.20.8`.

Install the React package and its declared peer package graph explicitly:

```bash
pnpm add @ahoo-wang/fetcher@^5.0.0 \
  @ahoo-wang/fetcher-react@^5.0.0 \
  @ahoo-wang/fetcher-eventstream@^5.0.0 \
  @ahoo-wang/fetcher-eventbus@^5.0.0 \
  @ahoo-wang/fetcher-storage@^5.0.0 \
  @ahoo-wang/fetcher-wow@^5.0.0 \
  @ahoo-wang/fetcher-decorator@^5.0.0 \
  @ahoo-wang/fetcher-cosec@^5.0.0 \
  react@^19.2.8 react-dom@^19.2.8
```

This section connects an existing Vite application to an existing API; it does not install or create a backend. Copy the component above to `src/ReactRequests.tsx`. Its default base URL is `/api`; point that path at a backend with these demo routes, or pass another `baseURL`:

| Route        | Response used by the component                                                                                                          |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /users` | HTTP 200 JSON array such as `[{ "id": "u-ada", "name": "Ada" }]`                                                                        |
| `GET /error` | Any non-2xx response; the repository fixture uses HTTP 500 with `{ "message": "Fixture server error" }`                                 |
| `GET /slow`  | A delayed HTTP 200 JSON object such as `{ "status": "completed" }`; the server must observe request cancellation if it should stop work |

Then replace the Vite entry file `src/main.tsx` with:

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ReactRequests } from './ReactRequests';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ReactRequests />
  </StrictMode>,
);
```

Keep Vite's generated `index.html`, then run `pnpm dev` and open the URL it prints. Cancellation can stop browser-side work only when the underlying operation observes the AbortSignal; it cannot roll back a request the server already applied.
