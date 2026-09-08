---
title: 'Saved-view panels and persistence callbacks'
description: 'Saved-view panels and persistence callbacks — @ahoo-wang/fetcher-viewer 5.0.0'
---

# Saved-view panels and persistence callbacks

The saved-view components are UI building blocks around ViewState. A mutation callback requests persistence; the success callback acknowledges that the application has completed it. Do not call success before the write is confirmed if closing the editor would hide a failed save.

| Component                | Contract                                                                                                                                                                                   |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| SaveViewModal            | mode Create/SaveAs, controlled open, optional defaultViewType/defaultViewName; defaults PERSONAL/empty name. onSaveView(name,type) runs after form validation. onCancel delegates closing. |
| ViewPanel                | Requires name/views/activeView/countUrl and switch/show-panel/create/update/delete callbacks. Groups PERSONAL/SHARED views.                                                                |
| ViewItemGroup / ViewItem | Render selection and counts. Optional onGetRecordCount(countUrl,condition) returns Promise&lt;number&gt;; count starts 0, labels above 999 show 999+.                                      |
| ViewManageModal          | Controlled open and viewType; onEditViewName/onDeleteView receive a completion callback that exits editing.                                                                                |
| ViewManageItem           | Required editing/onEdit/onCancel/onSave/onDelete; rejects a blank trimmed name locally. SYSTEM entries hide edit/delete controls.                                                          |

SaveViewModal does not close itself after save. The parent owns open state and errors. It validates required fields and string length, not a remote uniqueness constraint. ViewPanel creates a CUSTOM, nondefault copy of the active view; assigning a new identity and persisting it is the caller's responsibility. View mutation callbacks return void, so asynchronous work must catch its own rejection. The package does not provide a generic rollback transaction or saved-view storage adapter.

ViewItem refetches counts when countUrl, callback identity or view.condition changes. It does not implement request cancellation, stale-response suppression or a catch UI; the application callback must manage failures appropriately. Item editor names use local initial state and reset from the view on cancel. Do not assume every changed default prop instantly rewrites an in-progress edit.

For server-integrated command/visibility confirmation use [FetcherViewer](./fetcher-viewer). For a fully local application, retain the array of ViewState and implement mutations against your chosen store. The following example closes only after the supplied persistence function resolves and displays failures without discarding input.

## Complete example

```tsx
import { useState } from 'react';
import { SaveViewModal } from '@ahoo-wang/fetcher-viewer';
import type { ViewType } from '@ahoo-wang/fetcher-viewer';
export function SaveDialog({
  persist,
}: {
  persist: (name: string, type: ViewType) => Promise<void>;
}) {
  const [open, setOpen] = useState(true);
  const [error, setError] = useState('');
  return (
    <>
      {error && <p role="alert">{error}</p>}
      <SaveViewModal
        mode="Create"
        open={open}
        onCancel={() => setOpen(false)}
        onSaveView={(name, type) => {
          void persist(name, type)
            .then(() => setOpen(false))
            .catch(error => setError(String(error)));
        }}
      />
    </>
  );
}
```

## Public signatures and types

These signatures follow declarations reachable from the current root entry. `?` marks optional input; generics/interfaces only constrain compile-time types. Locate inherited and related types through the [symbol index](./symbols). Runtime defaults and failure behavior are described above.

### ViewItem {#api-ViewItem}

```ts
export function ViewItem(props: ViewItemProps): import('react').JSX.Element;
```

[packages/viewer/src/viewer/panel/ViewItem.tsx:93](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/viewer/panel/ViewItem.tsx#L93)

### ViewItemProps {#api-ViewItemProps}

```ts
export interface ViewItemProps extends GetRecordCountActionCapable {
  view: ViewState;
  countUrl: string;
  active: boolean;
}
```

[packages/viewer/src/viewer/panel/ViewItem.tsx:12](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/viewer/panel/ViewItem.tsx#L12)

### ViewItemGroup {#api-ViewItemGroup}

```ts
export function ViewItemGroup(
  props: ViewItemGroupProps,
): import('react').JSX.Element;
```

[packages/viewer/src/viewer/panel/ViewItemGroup.tsx:21](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/viewer/panel/ViewItemGroup.tsx#L21)

### ViewItemGroupProps {#api-ViewItemGroupProps}

```ts
export interface ViewItemGroupProps extends GetRecordCountActionCapable {
  views: ViewState[];
  activeView: ViewState;
  countUrl: string;
  onSwitchView: (view: ViewState) => void;
}
```

[packages/viewer/src/viewer/panel/ViewItemGroup.tsx:10](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/viewer/panel/ViewItemGroup.tsx#L10)

### ViewPanel {#api-ViewPanel}

```ts
export function ViewPanel(props: ViewPanelProps): React.JSX.Element;
```

[packages/viewer/src/viewer/panel/ViewPanel.tsx:32](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/viewer/panel/ViewPanel.tsx#L32)

### ViewPanelProps {#api-ViewPanelProps}

```ts
export interface ViewPanelProps extends GetRecordCountActionCapable {
  name: string;
  views: ViewState[];
  activeView: ViewState;
  countUrl: string;
  onSwitchView: (view: ViewState) => void;
  onShowViewPanelChange: (showViewPanel: boolean) => void;
  onCreateView: (view: ViewState, onSuccess?: () => void) => void;
  onUpdateView: (view: ViewState, onSuccess?: () => void) => void;
  onDeleteView: (view: ViewState, onSuccess?: () => void) => void;
}
```

[packages/viewer/src/viewer/panel/ViewPanel.tsx:18](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/viewer/panel/ViewPanel.tsx#L18)

### SaveViewModal {#api-SaveViewModal}

```ts
export function SaveViewModal(
  props: SaveViewModalProps,
): import('react').JSX.Element;
```

[packages/viewer/src/viewer/panel/SaveViewModal.tsx:17](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/viewer/panel/SaveViewModal.tsx#L17)

### SaveViewModalProps {#api-SaveViewModalProps}

```ts
export interface SaveViewModalProps {
  mode: 'Create' | 'SaveAs';
  open?: boolean;
  defaultViewType?: ViewType;
  defaultViewName?: string;
  onSaveView?: (name: string, type: ViewType) => void;
  onCancel?: () => void;
}
```

[packages/viewer/src/viewer/panel/SaveViewModal.tsx:7](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/viewer/panel/SaveViewModal.tsx#L7)

### ViewManageItem {#api-ViewManageItem}

```ts
export function ViewManageItem(
  props: ViewManageItemProps,
): import('react').JSX.Element;
```

[packages/viewer/src/viewer/panel/ViewManageItem.tsx:16](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/viewer/panel/ViewManageItem.tsx#L16)

### ViewManageItemProps {#api-ViewManageItemProps}

```ts
export interface ViewManageItemProps {
  view: ViewState;
  editing: boolean;
  onEdit: (view: ViewState) => void;
  onCancel: () => void;
  onSave: (view: ViewState) => void;
  onDelete: (view: ViewState) => void;
}
```

[packages/viewer/src/viewer/panel/ViewManageItem.tsx:7](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/viewer/panel/ViewManageItem.tsx#L7)

### ViewManageModal {#api-ViewManageModal}

```ts
export function ViewManageModal(
  props: ViewManageModalProps,
): import('react').JSX.Element;
```

[packages/viewer/src/viewer/panel/ViewManageModal.tsx:15](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/viewer/panel/ViewManageModal.tsx#L15)

### ViewManageModalProps {#api-ViewManageModalProps}

```ts
export interface ViewManageModalProps {
  viewType: ViewType;
  views: ViewState[];
  open?: boolean;
  onCancel?: () => void;
  onDeleteView?: (view: ViewState, onSuccess?: () => void) => void;
  onEditViewName?: (view: ViewState, onSuccess?: () => void) => void;
}
```

[packages/viewer/src/viewer/panel/ViewManageModal.tsx:6](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/viewer/panel/ViewManageModal.tsx#L6)

## Related topics

[Models and state ownership](./models-and-state) · [View and Viewer composition](./view-and-viewer) · [FetcherViewer remote integration](./fetcher-viewer) · [Filters and editable panels](./filters) · [Tables, columns and cells](./tables-and-cells) · [Registries, inputs and fullscreen button](./registries-and-inputs) · [Toolbar, refresh and locale](./toolbar-and-locale)
