# Analysis charts and Wow API — approved design

User confirmed shadcn Chart + Recharts, production-quality analysis UX and API integration, using linyi-k8s dev compensation-service for live verification. The existing analysis/table design and NodeNext repair remain in place. No commit, release, cluster update or compensation write is authorized.

## Product and architecture

- One ViewEngine continues to own sessions, cancellation, result snapshots and persistence. Record and analysis remain independent business modules.
- Query configuration (scope, filters, groups, metrics, sort, limit) and visualization configuration are distinct. Switching chart styles consumes existing verified rows and never dispatches a query.
- Keep the current explicit run/save flow and draft retention. An already executed result retains its query meaning while working configuration is edited.
- shadcn Chart + Recharts provides the presentation implementation, with scoped fve theme tokens and lazy chart loading. No second chart engine is introduced.
- Desktop: compact collapsible configuration panel beside a prominent result surface. Narrow layouts: accessible configuration dialog/drawer. Show a persistent executed-scope summary, stale/error/limit state and table access.
- Charts: table, metric cards, vertical/horizontal bar, line, area and pie/donut. Use continuous time/numeric coordinates where required; allow a category series split. Unsupported dimensionality/units return an actionable explanation plus the table, never hidden reaggregation.
- Result projection is pure: stable alias/tuple identity, explicit numeric metrics, null gaps, safe date handling, no averaging averages, no fabricated zero buckets, no global-total claims from truncated groups. Bound displayed points/series and explain limits.

## Query capabilities

Extend the existing compiler rather than adding a second query execution layer. Support authorized predefined Elements scope chains with filters, bounded FIELD/CONSTANT/BINARY expressions, and scalar ANY representative values; preserve root filters and relative element field paths. Capability metadata supplies the permitted fields and optional units. ANY never becomes a stable group key or numeric chart series.

Use separate presentation validation so a display compatibility problem does not require a network query. Persisted malformed presentation remains repairable and cannot silently change its meaning.

## Runtime integration

Confirmed live: context linyi-k8s, namespace dev, service compensation-service port 80 → 8080, image 9.0.16. OpenAPI exposes GET /execution_failed/snapshot/schema, POST /execution_failed/snapshot/aggregation and POST /execution_failed/snapshot/count; event equivalents also exist. CORS preflight permits the local Storybook origin. The current verification forward is 127.0.0.1:18916 (temporary).

Reuse SnapshotQueryClient / EventStreamQueryClient and Fetcher. Read Schema before publishing UI field capabilities. Example connection settings stay local; never persist credentials or raw failed-event payloads in fixtures. Pure source adapters and examples must be independently testable with HTTP fixtures. Live verification is read-only, with bounded aggregation requests and comparison to count where meaningful.

## Acceptance

- Pure compiler/projection tests for aliases, expression scope, numeric limits, 0/null/empty, time order, units and unsupported shapes.
- HTTP integration tests for actual request body/path, attributes, errors and cancellation.
- Live dev schema, COUNT, category, numeric and temporal queries; record exact contracts and sanitized observations.
- Browser checks for chart switching without queries, configuration responsiveness, saved layout restoration, theme, keyboard/tooltip access, stale data and recoverable failures.
- Dependency builds, root unit gate with bounded workers, React Compiler mode, strict packed NodeNext/Bundler consumers, scoped lint and bilingual docs.
