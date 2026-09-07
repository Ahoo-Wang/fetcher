# Fetcher View Engine

Independent `@ahoo-wang/fetcher-view-engine` package with headless Wow filter compilation and validation, a complete `FilterPanel`, structured value editors, and shadcn/Base UI controls. It also provides a headless ViewEngine and a complete RecordView page with host-managed definitions, instances and persistence. Cards, AnalysisView and DashboardView remain separate work.

## Module responsibilities

The public `ViewEngine` composes internal services; applications use its public commands and snapshots. The core runtime imports no React, DOM or table component library.

| Module                                                     | Owns                                                                                                                     |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `record/engine/SessionStore`, `sessionState`               | Immutable snapshots, subscriptions, saved/editing baselines and derived dirty/pending state.                             |
| `EngineScope`, `InstanceWork`                              | Lifetime/navigation versions, cancellable selection, write/reload exclusion and uncertain create receipts.               |
| `RecordEdits`                                              | Validated draft/config changes and the record/summary queries each change requires.                                      |
| `RecordQueries`, `RecordSummaries`                         | Independent record and aggregate requests, cancellation, result validation and failure recovery.                         |
| `ViewLoader`, `ViewReload`                                 | Definition/instance loading, navigation and reload reconciliation without discarding edits.                              |
| `ViewPersistence`, `ViewManagement`, `instancePermissions` | Save/save-as, names/deletion/user order, permissions and response reconciliation.                                        |
| `record/validation`                                        | Definition, instance/list and record trust boundaries.                                                                   |
| `filter`                                                   | Operator metadata, protocol construction/compilation, editor lifetimes and focused panel/value components.               |
| `record/page`, `record/table`                              | Page ownership/navigation/actions and table state/header/body/cell/summary composition. Layout calculations remain pure. |

Tests and Storybook interactions are grouped by behavior. Source modules target 300 lines and none exceed 400. The 347-line `useFilterPanelState` deliberately retains one controlled editor lifecycle: splitting its coordinated draft/acknowledgement transitions would separate state that must change together. Its synchronous callback boundary and externally supplied editing baselines have regression coverage.

## Runnable public-package examples

From the repository root, using the existing workspace dependencies:

```bash
pnpm --filter @ahoo-wang/fetcher-view-engine build
node packages/view-engine/examples/core.mjs
node packages/view-engine/scripts/verify-package.mjs
pnpm exec vite packages/view-engine/examples/react --host 127.0.0.1 --port 4175
```

`examples/core.mjs` runs the headless public API. The standalone `examples/react/OrderExample.tsx` composes a page and all five extension types using public imports only. Open `http://127.0.0.1:4175`, or **View Engine → Library Delivery** in Storybook, for actions, custom filtering/cells, error recovery and a narrow dark view.

`verify-package.mjs` creates a temporary archive, checks its exports/CSS and exact distribution content, then runs and type-checks consumers against the extracted package. It performs no installation or publication. These are library integration examples backed by a strict local simulated service; production authentication, authorization, persistence and backend query behavior still require host-system verification.

## RecordView

```tsx
import type { ViewHost } from '@ahoo-wang/fetcher-view-engine';
import { ViewPage } from '@ahoo-wang/fetcher-view-engine/react';
import '@ahoo-wang/fetcher-view-engine/styles.css';

export function OrderPage({
  host,
  scopeKey,
}: {
  host: ViewHost;
  scopeKey: string;
}) {
  return (
    <ViewPage
      scopeKey={scopeKey}
      definitionId="orders"
      host={host}
      selectable
    />
  );
}
```

`ViewHost` loads the definition and complete instance list, resolves a configured
Wow query source, supplies permissions, and optionally saves/creates instances.
For local data, pass `definition` and `instances: {instances, defaultInstanceId}`
to the page. Required `scopeKey` identifies the user/tenant/access scope; change
it when that scope changes. The engine lives for `[scopeKey, definitionId]`.
Same-scope host callbacks and capabilities update without discarding drafts.
Local definition/list values initialize that lifetime; changing their object
references does not reload them. Change the React key to explicitly reinitialize.
`ViewPage` owns the engine lifecycle; use
`ViewPageContent` or `RecordView` with an existing engine when the host owns it.

The engine derives filter pending state from `filterDraft`, its last-applied
`filterBaseline`, and reported editor validity (`filterValid`). `setFilterDraft(draft, id?, valid?)`
can atomically publish a draft and local validity. `setFilterValidity(valid, id?)`
reports an invalid local buffer; reporting true cannot clear a changed draft.
Apply or Undo must return it to an applied baseline before saving. Unset controls
remain part of that baseline. The old `setFilterPending` setter has been removed.
`applyFilter` rejects while an editor reports invalid input, even when applying
the current expression again. Correct the input or undo it before submitting;
the rejection changes neither the draft nor the current query.

Core snapshots use `DeepReadonly` for definitions, instances, drafts and records.
Read these values directly, or pass them back to `applyFilter`, `setFilterDraft`,
`setSort` and `setColumns`; the engine copies accepted inputs. Build edits as new
objects. Host query/write requests receive independent, editable DTOs.

The table uses shadcn Table + TanStack Table with server sorting and paged or
forward cursor queries. Resize at table-header edges by dragging, with keyboard arrows as an accessible alternative. Reorder columns by dragging their handles within the same
fixed region, or focus a handle and use Up/Down keys; show/hide columns there too.
Dropping commits the order; cancelling leaves it unchanged. Presentation edits never
query. Only Query applies filter edits. The page retains drafts per instance and
guards save/save-as while filters are pending. Save-as supports personal/shared
instances; permissions and actual persistence remain with the host.

The compact workbench orders its global toolbar as title, current instance and Save split button, with Save As/Restore in the menu. Creation stays on the right.
The active instance has no separate edited badge; save enablement reflects the guarded draft state.
Successful saves briefly show a check and “已保存”, with an accessible announcement.
Personal and public views form two navigation groups; system views carry a System badge.
**Manage views**, beside the sidebar heading and inside the view switcher dropdown, combines inline
name editing, confirmed deletion and within-group drag ordering. Names display
as text until Edit is clicked. Save or Cancel returns to text; Escape cancels
only the current name edit, while failed saves keep the input for retry. System views
cannot be renamed or deleted; their personal display position can still change.
Implement `host.renameInstance(id, title, revision?)` / `deleteInstance(id, revision?)`
and grant `rename` / `delete` through `getInstancePermissions`. Renaming changes
only persisted metadata, retaining pending filters and unsaved column configuration.
The optional `saveInstanceOrder(definitionId, ids)` stores ordering for the fixed
current user, including public views; it must not change other users' ordering.
Writes persist before updating the list and failures keep edits available for retry.
The headless engine exposes `renameInstance(title, id?)`, `deleteInstance(id?)`,
`canReorderInstances()` and `reorderInstances(ids)`. Save As and Restore remain
in the original split button; its standalone Delete entry is removed.

When saving the current instance is not permitted, Save As becomes the primary action.
Save As uses radio buttons with descriptions for Personal (visible only to you)
and Public (visible to users with access). Unavailable scopes remain visible but
disabled, and the initial selection uses an allowed scope.
The filter split button toggles the panel and selects simple/advanced mode without
an extra heading row. Add filter sits on the left; Undo, Clear and Query align right.
A separate table toolbar shows the selected count and Clear selection on the left,
with batch actions and column settings on the right. Clear selection
keeps the query and filter draft. Pending edits appear near Query when expanded
and in the filter toggle when collapsed; the current title/sidebar does not repeat
the notice, while other instances retain pending markers. Record counts and
pagination share the footer. Collapsing filters keeps editors, drafts and selection.
A compact applied-filter summary sits below the editor and above the table toolbar,
remaining visible when the editor is collapsed. Top-level AND conditions appear as
separate shadcn Badge tags; OR/NOR and element conditions remain complete groups.
Each tag's close button unsets its values and immediately queries, retaining every
field, operator, group and editor ID. Value-free predicates have no clear button.
Clearing is disabled while a query is loading or unapplied edits remain; query or
undo those edits first. Enter in a single-line filter input applies the query;
IME composition, selectors, multiline inputs and popup interactions keep their
normal keyboard behavior.
Labels preserve exact thresholds and wrap long expressions; no conditions displays
all records. Pending edits do not replace the applied tags until Query is applied.
The global filter toggle only controls visibility and mode; it has no applied-filter tooltip.

Unpinned string columns without enum options or an explicit `width` share spare container width,
starting from 180px and growing up to 480px. Explicit widths, pinned columns and
other field types keep their configured/default sizes. Narrow tables scroll
horizontally. Dragging an automatic column persists its actual new width. Column settings have
no width input; definitions can omit width to opt into automatic sizing. Container
resizing never edits the instance or queries. Space that cannot be assigned stays
before right-pinned columns, keeping actions at the right edge. The responsive
workbench Storybook scene shows 15 records per page.
Numeric cells and headers align right and use tabular numerals, including cells
rendered by extensions unless the extension overrides their alignment.

When pinned regions leave less than 128px for business fields, the table uses a
temporary compact layout: row keys shrink with full values available in tooltips,
action columns use 64px popover triggers, and ordinary pinned fields scroll with
the center region. Saved widths and pinning return when space allows; key/action
resize handles are available in the regular layout. Extremely small containers or
many mandatory columns show an explicit space warning. This adaptation does not
persist presentation changes.

Query failures render in the record area, with an icon, cause and retry. They do not
show the empty-result icon, zero-record claims or pagination. Background failures
retain existing rows and label them as the previous result. Auto-refresh tooltips
explain pauses and what will resume the countdown.

Summary calculation/query helpers consume `RecordSummaryMetric[]` (`id`, `field`,
`function`) independently of table settings. Use
`getRecordSummaryMetrics(instance.config.presentation)` to adapt a table instance.
Common instance metadata, record query settings and table presentation are named
separately as `ViewInstanceMetadata`, `RecordQueryConfig` and `RecordTablePresentation`.

The field bound to `definition.rowKey` always stays at the left edge, and action
columns at the right edge. Their sides cannot be changed by saved preferences or
column settings. An unpinned field can be pinned only when exactly one adjacent settings row is
pinned; it inherits that neighbor's side. Neither neighbor pinned, or both pinned,
disables pinning. Ordinary pinned fields can be unpinned; no side selector is shown.
Numeric summaries share the same settings row with visibility and pinning. The contract still accepts
`pinned: 'left' | 'right' | false` from the host, preserving configured sides until
edited. Pin choices persist with the instance. Headers, rows and summaries move together, with
resizing/visibility reflected in their offsets. Selection stays before the key
column. Pin/order changes do not query records or aggregates.

`extensions.cells`, `extensions.globalActions`, `extensions.tableActions`, `extensions.rowActions`, and
`extensions.filters` register local React components referenced by JSON names.
Extension inputs use exported `DeepReadonly<T>` snapshots. Copy the fields needed
into a component's own form state, then submit changes through host commands or
engine methods. Unsubmitted filter edits do not rerender the record-cell boundary.
Action rendering errors recover when the renderer's inputs change, including
selection or query state; unrelated draft edits do not repeatedly retry a failure.
Definitions use `recordActions.global`, `.table` and `.row` to choose their action
areas (for example, create, batch process and inspect record). Existing global
registrations retain their location; move batch components to `tableActions` explicitly.
Business actions receive the applied scope, stable record keys and an
instance-bound refresh callback. Selection contains explicit current-page keys.
Records, definitions and instances must be JSON data; keys must be unique strings
or finite numbers, with no index fallback. The core import remains React-free.

See **View Engine → Record View** in Storybook and the full
[host/renderer API contract](../../skills/fetcher-view-engine/references/api.md#record-views-and-host-contract).
The stories use an in-memory service to demonstrate request/response behavior.

### Page and all-record summaries

Only fields declared as `type: 'number'` support column summaries. Set
`summary: ['SUM', 'AVG', 'MIN', 'MAX']` to select several metrics for one column.
Column settings use a multi-select; deselecting every option disables summaries.
Other field types have no summary controls. `field.summaryFunctions` can restrict the list, with `[]`
disabling summaries. Column functions are saved with the instance; COUNT is not
supported.

The footer displays page and all-record summaries together in two aligned rows,
listing each selected metric in SUM/AVG/MIN/MAX order. Scope labels appear once
on the left; metric labels and right-aligned numbers stay on one line. Loading
uses a centered Spinner for records and one Spinner beside each pending scope
label. Pending metric values stay blank, and pagination does not repeat loading
text.
Page values use the loaded records; all-record values use the host's Wow `aggregate`
with the applied filter, without fetching every record. Unapplied filter edits and
row selection do not change the scope. Aggregate loading/failure leaves page values
and records available, with a separate retry. Changing a function recalculates both
summaries without reloading the list.

Each failed scope shows one error icon beside its label. Click it to open the
cause; the all-record scope also offers a retry that only requests aggregation.
Failed metrics keep “—” placeholders. Errors stay in their summary row, without a
full-width alert below the table.

Numeric fields can set `numberFormat`, using `Intl.NumberFormatOptions` plus an
optional `locale` (default `zh-CN`). For money, use
`numberFormat: { style: 'currency', currency: 'CNY' }`; for integers, use
`{ maximumFractionDigits: 0 }`. Decimal formatting defaults to at most two
fraction digits unless digit options are supplied; other styles use Intl defaults.
Default record cells and summaries share this format. Custom cells can reuse
`formatRecordNumber(value, field)`. Formatting does not change records or aggregate
values. Focus or hover a summary value to see its raw precision in a tooltip.

Numeric functions skip null/missing values. Empty inputs return null (“—”), distinct
from zero. Headless consumers can use `calculateRecordSummary`,
`createRecordSummaryQuery`, `readRecordSummaryResult`, or the engine's
`refreshSummary` method and session `pageSummary` / `allSummary`. Result values
are keyed by column ID and function, for example `values.amount.SUM`. Across all
columns, at most 64 metrics are allowed.

### Automatic refresh and expansion

The top global toolbar provides combined manual/automatic refresh and page expansion.
Automatic refresh defaults to off, with 30 second / 1 minute / 5 minute intervals. Background reads retain the current records
until success and do not overlap. Automatic refresh pauses for pending filters,
selected records, active writes, errors, hidden documents or focused editors and
popups; later cursor pages also pause. It waits for all-record summaries before
reading again. Failed reads retain records for manual retry. Pass
`autoRefreshPaused` to `ViewPage`, `ViewPageContent` or `RecordView` to pause during
host-owned business operations. Switching instances resets the interval.

The refresh button shows the selected interval and a `mm:ss` countdown computed
from the next deadline. It shows Paused while blocked and Refreshing during a
read; resuming, changing the interval or finishing a refresh starts a full new
interval. Countdown changes do not trigger per-second screen-reader announcements.

Headless consumers can call `engine.refresh(id, {background: true})` and observe
`session.refreshing`. The engine enforces the query, selection and write guards;
the React controls additionally manage timers, document visibility and focus.

Expand fills the page viewport and preserves browser tabs, filters, selection
and pagination. Escape closes the active popup first, then collapses the view;
the toolbar also provides Collapse. Within an iframe expansion stays in that
frame. These display preferences are not saved to the instance. Storybook's
**Automatic refresh and page expansion** example demonstrates both controls.

## FilterPanel

```tsx
import { useState } from 'react';
import { filter, type FilterExpression } from '@ahoo-wang/fetcher-wow';
import type { FilterFieldDefinition } from '@ahoo-wang/fetcher-view-engine';
import { FilterPanel } from '@ahoo-wang/fetcher-view-engine/react';
import '@ahoo-wang/fetcher-view-engine/styles.css';

const fields: FilterFieldDefinition[] = [
  { field: 'amount', label: 'Amount', type: 'number' },
  { field: 'status', label: 'Status', type: 'string' },
];

export function OrderFilters({
  onQuery,
}: {
  onQuery: (expression: FilterExpression) => void;
}) {
  const [value, setValue] = useState<FilterExpression>(filter.matchAll());
  return (
    <FilterPanel
      fields={fields}
      value={value}
      onApply={next => {
        setValue(next);
        onQuery(next);
      }}
    />
  );
}
```

Simple mode uses an implicit AND; advanced mode structurally edits all 50 Wow operators including AND / OR / NOR / ELEMENT_MATCH. Editing, clearing, undo and mode switches make no requests. Query calls `onApply` with a valid expression. The host synchronously updates `value`, executes the request and supplies `querying` / `queryError`. Use `onPendingChange` to guard view saving.

Simple mode allows one condition per field, including unset values. Advanced AND/OR/NOR groups allow multiple conditions on the same field, including inside element scopes. Repeated bindings are valid for compilation and instance persistence; they keep the editor in advanced mode until each field occurs once and the tree is otherwise simple.

Add filter opens an anchored Popover with grouped checkboxes, keeping the table and query toolbar in place. Its height is capped and its field area scrolls internally. It stays open for continuous additions; Done or Escape closes it and returns focus to Add filter. Clicking outside dismisses it. Set `group` on field definitions to group choices in definition order. Ungrouped fields appear under Other fields when mixed with named groups. Checking a field adds its condition; unchecking removes that field's direct conditions in the current group. Checkbox state follows the draft even when a value is unset. Advanced mode shows each selected field’s condition count and an adjacent Append condition action for additional same-field predicates in any logical group; advanced mode places AND/OR/NOR in the adjacent icon dropdown instead of the field picker. Root-level operators remain add actions. Logical menu choices respect the definition allowlist. Changes apply only on Query.

Fully unset values keep their controls but produce no predicate; partial values, invalid data and missing extensions block Query. Fields bind when added and remain in their original group and scope. `extensions.filters` supplies local custom editors. `draft` / `onDraftChange` lets the host retain built-in edit buffers per instance; custom components should keep their own temporary UI state in host context or remain mounted.

Simple mode has no condition action menu or ordering controls. Advanced mode supports adding, deleting and editing groups without moving conditions between groups. Built-in scalar rows omit Clear and Special value buttons; deleting input text leaves an unset value. Use null/empty-string operators for those predicates. Existing datetime edits retain their original offset in repeated DST hours, while dates in other seasons use their actual offset.

For composition, `FilterPanel.renderToolbar` replaces the default heading and receives
`FilterPanelToolbarProps`: `panelId`, `mode`, `options`, `pending`, `disabled` and
`onModeChange`. Use its guarded callback and disabled options; incomplete or nested
advanced conditions cannot switch to simple. `collapsed` hides only the body and
retains editors. `RecordView.toolbarStart` accepts leading global-toolbar content;
`ViewPage` supplies saving, title and instance navigation there.

Custom editors can use any React component. Register `render: 'value'` (the default) for the value area, or `render: 'filter'` with `FilterComponentProps` to own the complete non-container UI. The panel continues to validate bindings and capabilities, display errors, and apply only on Query.

## Individual controls

```tsx
import { useState } from 'react';
import {
  FieldFilter,
  InputGroupInput,
} from '@ahoo-wang/fetcher-view-engine/react';
import '@ahoo-wang/fetcher-view-engine/styles.css';

export function AmountFilter() {
  const [operator, setOperator] = useState('GTE');
  return (
    <FieldFilter
      field={{ field: 'state.amount', label: 'Amount' }}
      operator={operator}
      operators={[
        { value: 'EQ', label: 'Equals' },
        { value: 'GTE', label: 'At least' },
      ]}
      onOperatorChange={setOperator}
    >
      <InputGroupInput
        aria-label="Amount value"
        type="number"
        defaultValue="1000"
      />
    </FieldFilter>
  );
}
```

`FieldFilter` fixes the field label and delegates the value editor to its children. Operator selection only calls `onOperatorChange`; the host owns validation, pending edits, applying a query and saving a view. `FilterSelect` also supports controlled enum values, field-add pickers and logical group choices. Pass `onClear={() => setValue(null)}` to offer Clear selection in its popup; omit it for required operator selectors.

`FilterSearchSelect` provides a select popup with built-in candidate search using Base UI Combobox. It shares `FilterSelect` props and adds `searchPlaceholder` / `emptyText`; typing filters local candidates, while selection and clearing update only the editor. See the searchable customer extension in Storybook.

## Entries and theme

- The core entry exports field/draft contracts and filter compilation helpers without React, DOM or CSS.
- `/react` exports `FilterPanel`, `FilterValueEditor`, individual filter controls and composition primitives.
- `/styles.css` contains compiled, prefixed styles. Consumers do not need Tailwind. React 19 is required when using `/react`.

Styles reuse the shadcn base-nova Neutral theme. Utilities use the `fve:` prefix; theme tokens use `--fve-*`. Wrap controls in `.fve-root` to override tokens together; `data-theme="light"` and `data-theme="dark"` select an explicit appearance. Without an explicit theme, components follow the inherited CSS `color-scheme` using `light-dark()`.

Select menus, dropdown menus and Popover panels use a body portal so clipping ancestors do not hide them. Each opening, including a controlled `open` change, copies the control's current theme tokens, color scheme and typography to the portal. `SelectContent.container` is available for hosts that explicitly choose another Select portal target.

`FilterDatePicker` uses the shadcn Calendar with a Chinese locale and a controlled `Date | undefined`. `FilterTimeInput` combines a text input with hour/minute/second Select controls; it preserves incomplete input and up to nine fractional-second digits. Both accept `inline` for composition inside `FieldFilter`. The host owns timezone conversion, storage precision and applying the query. Unset values are valid: keep the editor visible and omit its value-dependent predicate on Query. If no predicates remain, apply `filter.matchAll()`. A date/time pair is unset only when both parts are empty; partial values require completion. Clock selectors preserve the other typed segments during partial input. Malformed nonempty input remains invalid; value-free operators and explicit null/zero/false literals retain their Wow semantics.

## Development

```bash
pnpm --filter @ahoo-wang/fetcher-view-engine build
pnpm --filter @ahoo-wang/fetcher-view-engine test
pnpm storybook
```

Start at **View Engine → Filter Panel** in Storybook for business filters, nested element scopes, custom-editor validation, query retry, dark mode and the 50-operator gallery. **View Engine → Date and Time** covers individual date/time controls. The examples cover a combined field with manual query, a calendar, a precise time value, incomplete input, unset values and the dark theme. The **View Engine → Filter Select** example covers selecting, clearing and selecting again. Controls expose appearance and disabled states. The combined example uses the browser's local timezone and an epoch-millisecond Wow expression without contacting a service. Rebuild the package after changing its source; these stories consume its public built exports.

See [the API reference](../../skills/fetcher-view-engine/references/api.md) and [third-party notices](THIRD_PARTY_NOTICES.md).
