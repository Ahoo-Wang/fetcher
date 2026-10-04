# Detection checklist

Run from the project root. Each block says what a hit means. Source of truth:
`docs/releases/v6.0.0.md` in the fetcher repository.

## Blocking usages

```sh
# 1. Manifests and lockfiles: packages that left fetcher
grep -rnE '"@ahoo-wang/fetcher-(wow|generator|viewer)"' --include=package.json . | grep -v node_modules
grep -nE '@ahoo-wang/fetcher-(wow|generator|viewer)@' pnpm-lock.yaml package-lock.json yarn.lock 2>/dev/null

# 2. Imports of the moved packages, generated code included
grep -rnE "from ['\"]@ahoo-wang/fetcher-(wow|viewer)(/[^'\"]*)?['\"]" --include='*.ts' --include='*.tsx' --include='*.js' --include='*.jsx' . | grep -v node_modules

# 3. Wow query hooks: a problem only when imported from @ahoo-wang/fetcher-react
grep -rnE '\b[uU]se(Fetcher)?(Single|List|Paged|Count|ListStream)Query(Options|Return)?\b' --include='*.ts' --include='*.tsx' . | grep -v node_modules

# 4. Data-monitor hooks: no replacement
grep -rnE '\b(useDataMonitor(EventBus)?|UseDataMonitor(Options|Return|EventBusReturn)|[dD]ataMonitorService|DataMonitorNotificationConfig|DataChangedEvent|dataMonitorEventBus)\b' --include='*.ts' --include='*.tsx' . | grep -v node_modules

# 5. The generator command in scripts and CI
grep -rnE '\bfetcher-generator\b' package.json .github scripts Makefile 2>/dev/null
```

| Hit              | Meaning                                                                                           |
| ---------------- | ------------------------------------------------------------------------------------------------- |
| 1–2 `wow`        | Switch to `@ahoo-wang/wow-client` (9.2.1 or later) before upgrading fetcher                       |
| 1 `generator`, 5 | Switch to `@ahoo-wang/wow-generator`, command `wow-generator`, then regenerate                    |
| 1–2 `viewer`, 4  | Stay on 5.x, or remove the usage first                                                            |
| 3                | Move the import to `@ahoo-wang/wow-react`; check the import source first, it may already be there |

Pattern 3 does not match `useFetcherQuery` or `useQuery`: both stay in
`@ahoo-wang/fetcher-react`.

## `@ahoo-wang/fetcher-react` API (rewrite, never a reason to stay on 5.x)

```sh
# 6. Hooks and options removed or changed by the redesign (tsc reports most)
grep -rnE '\b(useFullscreen(Context)?|FullscreenProvider|FullscreenContext|useRefs|useForceUpdate|useMounted|useRequestId|use(Cancellable)?QueryState|isValidateQuery|OnBeforeExecuteCallback|PromiseStateCallbacks|DepsCapable)\b|\b(propagateError|initialQuery|onBeforeExecute|getQuery)\b' --include='*.ts' --include='*.tsx' . | grep -v node_modules

# 7. Changed without a compile error
grep -rnE '\bsetQuery\b|\bisPending\(|\breset\(|request\.abortController|abortController\s*[:=]' --include='*.ts' --include='*.tsx' . | grep -v node_modules

# 8. Tests asserting idle on the first render of an auto-executing query
grep -rnE "status\)\.toBe\(('idle'|PromiseStatus\.IDLE)\)" --include='*.test.ts' --include='*.test.tsx' . | grep -v node_modules
```

Rewrite each hit with `react.md`.

## Behavior corrections in the other packages (they compile unchanged)

```sh
# 9. Status errors read from `cause`
grep -rnE 'cause\s+instanceof\s+HttpStatusValidationError' --include='*.ts' --include='*.tsx' --include='*.js' --include='*.jsx' . | grep -v node_modules
```

A non-2xx response now rejects with the `HttpStatusValidationError` itself (a
subclass of `ExchangeError`). Rewrite to `error instanceof HttpStatusValidationError`
and test it before `ExchangeError`. `error.exchange.error` still returns it.
A timeout, network failure or interceptor error is still wrapped:
`error.cause instanceof FetchTimeoutError`.

```sh
# 10. Headers that relied on the old default Content-Type
grep -rnE "Content-Type|contentType" --include='*.ts' --include='*.tsx' . | grep -v node_modules
```

No `Content-Type` is sent by default any more. A plain-object or string body
still gets `application/json`; `FormData`/`Blob`/`URLSearchParams` get what
fetch derives; binary and bodyless requests get none. Set it explicitly where
a server required the old blanket header. A `Content-Type` in the fetcher's
`headers` goes out on every request, `GET` included, and makes every
cross-origin request preflight.

```sh
# 11. Query and path parameters whose wire form changed
grep -rnE 'urlParams|@query\(|@path\(|@header\(' --include='*.ts' --include='*.tsx' . | grep -v node_modules
```

`undefined`/`null` query values are omitted (they were sent as text), arrays
repeat the key (`ids=1&ids=2`, was `ids=1%2C2`), a `Date` is ISO 8601. A path
placeholder without a value throws `Missing required path parameter` instead
of sending `{id}`; `:name.json` is the parameter `name`. In
`@ahoo-wang/fetcher-decorator`, an array or `Date` argument binds to the
parameter's name (it was spread into `0=…&1=…`), an array header is
comma-separated, a named `@attribute('user')` object is stored whole, and a
subclass override without its own endpoint decorator runs as written.

```sh
# 12. Streams that now reject when they end early
grep -rnE 'jsonEventStream\(|requiredJsonEventStream\(|toJsonServerSentEventStream\(|completions\(' --include='*.ts' --include='*.tsx' . | grep -v node_modules
```

With a terminate detector, and for every OpenAI completion stream, a stream
that ends before its terminating event (`data: [DONE]`) rejects the
`for await` loop with `EventStreamIncompleteError`. Handle it where mid-stream
errors are handled and do not present the partial answer as complete.
`ChatResponse.usage` is optional now: read it with `?.`.

```sh
# 13. CoSec setups and storage cleanup
grep -rnE 'new CoSecConfigurer\(|new (CoSecRequest|AuthorizationRequest)Interceptor\(|\.eventBus\.destroy\(' --include='*.ts' --include='*.tsx' . | grep -v node_modules
```

Add `isTrusted: sameOriginTrust` to each CoSec setup unless every absolute URL
the client requests is yours: by default an absolute URL on any origin still
receives the access token and device ID. A refresh that fails on the network,
a timeout or a 5xx now keeps the session and throws `RefreshUnavailableError`;
only a 4xx or a malformed token signs the user out. A JWT whose payload is not
an object reads as expired. `destroy()` now closes the bus a storage created
for itself, so a following `storage.eventBus.destroy()` on that bus is
redundant; a bus passed in `eventBus` stays open.

For `@ahoo-wang/fetcher-openapi`: `Info.title`, `Info.version` and
`Response.description` are required, `SecurityScheme.in` excludes `'path'`,
and `SecurityRequirement` takes no `x-` keys. `tsc` reports these.

UMD consumers loading a bundle by URL: `dist/index.umd.js` is now
`dist/index.umd.cjs` in `cosec`, `eventbus`, `openai`, `openapi`, `storage`
and `react`.
