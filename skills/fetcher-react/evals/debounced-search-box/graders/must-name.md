---
type: regex
pattern: 'useDebounced(?:FetcherQuery|Fetcher|Query|Value)\b'
match: contains
target: last_message
---

The answer names a debounced hook (`useDebouncedFetcherQuery`, `useDebouncedQuery`, `useDebouncedValue` or `useDebouncedFetcher`).
