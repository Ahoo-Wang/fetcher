---
next: false
title: Add application extensions
description: Register business renderers, compose record regions and select scoped CSS themes.
---

# Add application extensions

## Registered business extensions

| Need                          | Registration                | Configuration reference                               |
| ----------------------------- | --------------------------- | ----------------------------------------------------- |
| Global business operation     | `extensions.globalActions`  | `definition.recordActions.global`                     |
| Batch / table operation       | `extensions.toolbarActions` | `definition.recordActions.toolbar`                    |
| Per-record action             | `extensions.rowActions`     | `definition.recordActions.row` plus an actions column |
| Filter component and compiler | `extensions.filters`        | Field/editor/operator component reference             |
| Custom cell                   | `extensions.cells`          | `field.cellRenderer` or `column.renderer`             |

Each reference is `{ name, options? }`; options must be JSON data. Register components, service clients and callbacks in runtime extensions, never persisted JSON. Unknown names and invalid configuration surface an error. Start with built-ins before registering a custom implementation.

Action props include the readonly definition/instance, applied `filter`, `sort`, options and an instance-bound `refresh()`. Table/global actions also receive `selectedRowKeys` and `querying`; row actions receive `record` and `rowKey`. A null applied filter means query scope is unavailable. The application executes business writes, handles errors and prevents duplicates. Await a write, then refresh the bound instance; if refresh fails after a successful write, retry only the refresh.

A `FilterRegistration` combines a component, pure `compile(props, context)`, supported `modes`, and optional `supports` / `clear`. `onChange` publishes serializable props and does not query. Report incomplete input with `onValidityChange(false, message)`. Prepare filter registrations before creating the engine or mounting `ViewPage`; changing the same page's props cannot add registrations to that engine. Wait for asynchronously loaded registrations before mounting. Remounting resets the session and is not a lossless hot-update mechanism. Cells and action renderers retain their existing update behavior.

## Themes and record regions

Always import `styles.css`. It contains the components and default Neutral appearance. Importing `themes/neutral.css`, `blue.css`, `violet.css`, `green.css`, `orange.css` or `shadcn.css` only makes that theme available; `data-fve-theme` or `ViewTheme.theme` selects it. Import order does not select a theme, and separate `.fve-root` scopes may select different themes.

`ViewTheme` is an optional `/react` wrapper. `theme?: string` accepts built-in or arbitrary user names, `appearance` accepts `light`, `dark` or `system`, and `density` accepts `comfortable` or `compact`. Omitted values inherit. `ViewThemeStyle` accepts React CSS properties plus typed `--fve-*` entries for inline overrides. CSS remains the base API.

`renderToolbar` and `renderPagination` are available on `ViewPage`, `ViewPageContent` and `RecordView`. Their readonly contexts provide `defaultContent`, relevant state and instance-bound controlled operations. Return `defaultContent` to keep the standard region, wrap it to add UI, or return `null` to hide it. Render the default node at most once. The callback is a render function, so return a component when Hooks or local state are needed. The library isolates render failures by region; event-handler and async-operation failures still belong to application error handling.

Stable styling hooks are `data-slot="record-view"`, `record-global-toolbar`, `record-toolbar`, `record-applied-filters` and `record-pagination`. Internal DOM nesting and utility classes may change. The full global toolbar remains fixed because it owns refresh and expansion lifecycles.

## Four copyable recipes

### 1. Built-in theme

```tsx
import type { ViewHost } from '@ahoo-wang/fetcher-view-engine';
import { ViewPage, ViewTheme } from '@ahoo-wang/fetcher-view-engine/react';
import '@ahoo-wang/fetcher-view-engine/styles.css';
import '@ahoo-wang/fetcher-view-engine/themes/blue.css';

export function Orders({
  host,
  scopeKey,
}: {
  host: ViewHost;
  scopeKey: string;
}) {
  return (
    <ViewTheme theme="blue" appearance="system" density="compact">
      <ViewPage host={host} scopeKey={scopeKey} definitionId="orders" />
    </ViewTheme>
  );
}
```

### 2. User CSS theme

```css
/* brand.css */
.fve-root[data-fve-theme='brand'] {
  --fve-primary: light-dark(#1d4ed8, #93c5fd);
  --fve-primary-foreground: light-dark(#ffffff, #172554);
  --fve-ring: light-dark(#1d4ed8, #93c5fd);
  --fve-radius: 0.5rem;
}
```

```tsx
import type { ViewHost } from '@ahoo-wang/fetcher-view-engine';
import { ViewPage, ViewTheme } from '@ahoo-wang/fetcher-view-engine/react';
import '@ahoo-wang/fetcher-view-engine/styles.css';
import './brand.css';

export function Orders({
  host,
  scopeKey,
}: {
  host: ViewHost;
  scopeKey: string;
}) {
  return (
    <ViewTheme
      theme="brand"
      style={{ '--fve-font-size': '14px', '--fve-control-height': '2.25em' }}
    >
      <ViewPage host={host} scopeKey={scopeKey} definitionId="orders" />
    </ViewTheme>
  );
}
```

Partial themes inherit omitted variables. Pair foreground/background colors explicitly; the library does not derive accessible user colors. Use `px` or `rem` for `--fve-font-size`; `em` and `%` compound through the semantic text scale. Other size variables may use `em` relative to the effective font.

### 3. Host shadcn mapping

```tsx
import type { ViewHost } from '@ahoo-wang/fetcher-view-engine';
import { ViewPage, ViewTheme } from '@ahoo-wang/fetcher-view-engine/react';
import '@ahoo-wang/fetcher-view-engine/styles.css';
import '@ahoo-wang/fetcher-view-engine/themes/shadcn.css';

export function Orders({
  host,
  scopeKey,
}: {
  host: ViewHost;
  scopeKey: string;
}) {
  return (
    <ViewTheme theme="shadcn">
      <ViewPage host={host} scopeKey={scopeKey} definitionId="orders" />
    </ViewTheme>
  );
}
```

The host supplies complete CSS colors such as `oklch(...)`, `hsl(...)` or `#hex`; bare HSL channels are not parsed. Missing tokens use library defaults, while present invalid/cyclic tokens follow CSS invalid-value behavior. The host ThemeProvider owns persistence and `.dark`. A local light scope cannot recreate light tokens when the host only exposes dark values.

### 4. Stateful table-toolbar region

```tsx
import { useState } from 'react';
import type { ViewHost } from '@ahoo-wang/fetcher-view-engine';
import {
  ViewPage,
  type RecordToolbarRenderContext,
} from '@ahoo-wang/fetcher-view-engine/react';
import '@ahoo-wang/fetcher-view-engine/styles.css';

function OrdersToolbar({ context }: { context: RecordToolbarRenderContext }) {
  const [showHelp, setShowHelp] = useState(false);

  return (
    <>
      {context.defaultContent}
      <button type="button" onClick={() => setShowHelp(value => !value)}>
        {showHelp ? 'Hide help' : 'Show help'}
      </button>
      {showHelp && <span>{context.selectedRowKeys.length} selected</span>}
    </>
  );
}

export function Orders({
  host,
  scopeKey,
}: {
  host: ViewHost;
  scopeKey: string;
}) {
  return (
    <ViewPage
      host={host}
      scopeKey={scopeKey}
      definitionId="orders"
      selectable
      renderToolbar={context => <OrdersToolbar context={context} />}
    />
  );
}
```

The toolbar context also provides `definition`, `session`, `appliedFilter`, `querying`, `clearSelection()`, `setColumns()` and `refresh()`. Pagination provides `mode`, page state, availability flags and promise-returning page operations. Operations recheck current engine guards and stay bound to the instance that produced the callback.

## CSS and Portal limits

Unknown or unloaded themes do not throw; CSS inheritance/defaults continue to render. This does not prove that a theme file loaded. User CSS on the same theme root can override low-priority library values without `!important`, but ordinary CSS cascade rules still apply to duplicate theme names and nested explicit values.

Library portals copy computed public colors, typography, density and effective appearance. Variable themes cross the body portal; structural selectors such as `.brand [data-slot=...]` do not. Theme/density attributes, class, inline variables and system preference update an open portal. Arbitrary CSSOM stylesheet replacement without one of those changes is not observed. Third-party portals require their own theme-container mechanism.

CSS custom-property aliases resolve before inheritance. Define derived values at the target theme boundary instead of expecting a child override to recompute an inherited alias. Removing local variables or a theme attribute returns to the parent/default scope. See the [component reference](../../reference/view-engine/components.md) for component contracts and the package [public API table](https://github.com/Ahoo-Wang/fetcher/blob/main/skills/fetcher-view-engine/references/api.md) for every supported variable.

### Custom card content

Use `renderCard` on `ViewPage`, `ViewPageContent`, `RecordView` or `RecordCardList` to replace a card's content. The callback receives readonly record, rowKey, definition, instance, index, selected, defaultContent and an instance-bound refresh method. Return your own component for a custom information structure, or wrap defaultContent to keep the configured fields. Selection, grid, paging and error isolation remain library-managed. The callback is not persisted; default card settings affect only defaultContent.

```tsx
<ViewPage
  {...pageProps}
  renderCard={({ record, rowKey, selected }) => (
    <article>
      <h2>{String(rowKey)}</h2>
      <p>{String(record.amount)}</p>
      {selected && <span>Selected</span>}
    </article>
  )}
/>
```

The layout switch is a current-layout dropdown in the global toolbar at every width. The record toolbar keeps batch actions and layout settings.

The card preview includes real local order interactions: view details, process an order, batch-process selected orders and create an order. Both default and custom cards reuse the same row-action component. Processing updates the data and refreshes the current queue; failure feedback and retry use the existing order-operation provider. Demo business data resets on page reload; the persisted example saves view configuration separately.

`RecordView`/`ViewPage` hide built-in card settings when `renderCard` is supplied, including wrappers around `defaultContent`. Provide business configuration through the existing `renderToolbar` and `setCardConfig` when needed. Table column settings remain available.

The card Storybook now uses a 12-product home/travel catalog with local SVG covers, details, favorites and individual/batch publishing. Default, custom, narrow dark and saved-view examples share the same source. The original order business regressions remain separate.
