# AGENTS.md — @ahoo-wang/fetcher-viewer

<!-- This file provides coding agents with context about this package. -->

## Build & Run Commands

```bash
# Build this package
pnpm --filter @ahoo-wang/fetcher-viewer build

# Run tests
pnpm --filter @ahoo-wang/fetcher-viewer test

# Run a single test file
pnpm --filter @ahoo-wang/fetcher-viewer vitest run src/table/ViewTable.test.tsx

# Lint
pnpm --filter @ahoo-wang/fetcher-viewer lint

# Clean
pnpm --filter @ahoo-wang/fetcher-viewer clean
```

## Testing

- Vitest with `globals: true` and `@vitest/coverage-v8`
- **jsdom environment** with `test/setup.ts`
- Test files: `*.test.tsx` in a `test/` directory at the package root (mirroring `src/`)
- Run with `--coverage` flag by default

## Project Structure

```
src/
  index.ts                    — Barrel export
  types.ts                    — Shared type definitions
  utils.ts                    — Utility functions
  global.d.ts                 — Global type declarations (CSS modules, etc.)

  fetcherviewer/
    FetcherViewer.tsx         — Main FetcherViewer component
    types.ts
    client/                   — API client sub-modules
      boundedContext.ts, types.ts
      view/                   — View client (command, query)
      viewer_definition/      — Viewer definition client
    hooks/                    — FetcherViewer-specific hooks
      useFetchData.ts, useViewerDefinition.ts, useViewerViews.ts

  filter/
    AssemblyFilter.tsx        — Compound filter component
    BoolFilter.tsx            — Boolean filter
    DateTimeFilter.tsx        — Date/time filter
    FallbackFilter.tsx        — Fallback filter for unknown types
    IdFilter.tsx              — ID filter
    NumberFilter.tsx          — Number filter
    SelectFilter.tsx          — Select/dropdown filter
    TextFilter.tsx            — Text filter
    TypedFilter.tsx           — Type-aware filter dispatcher
    filterRegistry.ts         — Filter component registry
    useFilterState.ts         — Filter state hook
    types.ts, utils.ts
    operator/                 — Filter operators with locale
    panel/                    — Filter panel components
      FilterPanel.tsx, EditableFilterPanel.tsx
      AvailableFilterSelect.tsx, AvailableFilterSelectModal.tsx
      RemovableTypedFilter.tsx

  table/
    ViewTable.tsx             — Main data table component
    types.ts
    hooks/                    — Table-specific hooks
      useViewTableState.ts
    cell/                     — Cell renderer components
      TypedCell.tsx           — Type-aware cell dispatcher
      TextCell.tsx, DateTimeCell.tsx, CurrencyCell.tsx
      TagCell.tsx, TagsCell.tsx, LinkCell.tsx
      ImageCell.tsx, ImageGroupCell.tsx, AvatarCell.tsx
      ActionCell.tsx, ActionsCell.tsx
      PrimaryKeyCell.tsx
      cellRegistry.ts         — Cell component registry
    setting/                  — Table settings panel
      TableSettingPanel.tsx, TableFieldItem.tsx

  viewer/
    Viewer.tsx                — Viewer panel component
    types.ts
    hooks/                    — Viewer-specific hooks
      useViewerState.ts
    panel/                    — View management panel
      ViewPanel.tsx, SaveViewModal.tsx, ViewManageModal.tsx
      ViewItem.tsx, ViewItemGroup.tsx, ViewManageItem.tsx

  view/
    View.tsx                  — Individual view component
    hooks/
      useViewState.ts

  topbar/
    TopBar.tsx                — Top toolbar component
    RefreshDataBarItem.tsx    — Refresh button
    AutoRefreshBarItem.tsx    — Auto-refresh toggle
    FilterBarItem.tsx         — Filter toggle
    ColumnHeightBarItem.tsx   — Column height control
    DataMonitorBarItem.tsx    — Data monitor toggle
    FullscreenBarItem.tsx     — Fullscreen toggle
    ShareLinkBarItem.tsx      — Share link
    BarItem.tsx               — Generic bar item
    types.ts

  components/
    NumberRange.tsx           — Number range input
    RemoteSelect.tsx          — Remote data select
    TagInput.tsx              — Tag input component
    fullscreen/               — Fullscreen wrapper component

  hooks/
    useActiveViewState.ts     — Active view state hook
    useRefreshDataEventBus.ts — Refresh event bus hook

  locale/
    Locale.ts                 — Locale type definitions
    useLocale.ts              — Locale hook
    zh_CN.ts                  — Chinese locale data

  registry/
    componentRegistry.ts      — Global component registry (filters, cells)

  source/                     — Data source abstractions
```

### Key Concepts

- **FetcherViewer**: Main composite component combining filter, table, viewer, and topbar
- **Filter System**: Type-aware filter components with registry pattern for extensibility
- **Table System**: Configurable data table with typed cell renderers and registry
- **Cell Registry**: Pluggable cell renderers registered by field type
- **Filter Registry**: Pluggable filter components registered by field type
- **Locale/i18n**: Chinese locale support for operators and UI labels
- **Ant Design**: Built on Ant Design component library
- **Less styling**: `.module.css` and `.module.less` for scoped styles

## Dependencies

- All `@ahoo-wang/fetcher-*` packages
- `antd` + `@ant-design/icons` — UI component library
- React 19 + React Compiler

## Code Style

- TypeScript strict mode
- React 19 with React Compiler (`babel-plugin-react-compiler`)
- `@babel/plugin-proposal-decorators` (legacy mode) in Vite config
- Apache 2.0 license headers
- Prettier: single quotes, trailing commas, semicolons, 80 char width
- Scoped CSS modules (`.module.css`, `.module.less`)
- Stories for all components (`*.stories.tsx`)

## Git Workflow

- Conventional commits: `feat(viewer):`, `fix(viewer):`, `test(viewer):`
- Version synced via `pnpm update-version`

## Boundaries

- ✅ Adding new cell renderers to the registry
- ✅ Adding new filter components to the registry
- ✅ Adding new topbar items
- ✅ Writing new tests and stories
- ⚠️ Changing FilterPanel/EditableFilterPanel API — used by FetcherViewer
- ⚠️ Changing ViewTable column configuration — affects all viewer consumers
- ⚠️ Modifying locale system — ensure new keys have zh_CN translations
- 🚫 Breaking FetcherViewer component API
- 🚫 Removing existing cell/filter types without deprecation period
- 🚫 Changing Ant Design dependency major version without team discussion
