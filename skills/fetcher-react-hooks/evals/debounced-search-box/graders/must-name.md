---
type: regex
pattern: 'useDebounced(?:Fetcher)?(?:Query)?\b'
match: contains
target: last_message
---

The answer names a debounced hook (`useDebouncedFetcherQuery`, `useDebouncedFetcher` or `useDebouncedQuery`).
