---
title: '已保存视图面板与持久化回调'
description: '已保存视图面板与持久化回调 — @ahoo-wang/fetcher-viewer 5.0.0'
---

# 已保存视图面板与持久化回调

已保存视图组件围绕 ViewState 提供 UI。mutation 回调请求持久化，success 回调表示应用已完成；如果关闭编辑器会隐藏保存失败，不要在写入确认前调用 success。

| 组件                     | 契约                                                                                                                                                     |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SaveViewModal            | mode Create/SaveAs、受控 open，可选 defaultViewType/defaultViewName；默认 PERSONAL/空名称。表单验证后调用 onSaveView(name,type)，onCancel 交给父级关闭。 |
| ViewPanel                | 必填 name/views/activeView/countUrl 及 switch/show-panel/create/update/delete 回调；按 PERSONAL/SHARED 分组。                                            |
| ViewItemGroup / ViewItem | 显示选择与计数；可选 onGetRecordCount(countUrl,condition) 返回 Promise&lt;number&gt;，初值 0，超过 999 显示 999+。                                       |
| ViewManageModal          | 受控 open、viewType，onEditViewName/onDeleteView 的完成回调退出编辑状态。                                                                                |
| ViewManageItem           | 必填 editing/onEdit/onCancel/onSave/onDelete；本地拒绝 trim 后空名称，SYSTEM 隐藏编辑/删除。                                                             |

SaveViewModal 保存后不自行关闭，open 和错误由父级持有。它校验必填和字符串长度，不验证远端唯一性。ViewPanel 复制活动视图为 CUSTOM、非默认视图，分配新身份和持久化由调用者负责。mutation 回调返回 void，因此异步操作要自行 catch；本包没有通用回滚事务或保存视图存储适配器。

ViewItem 在 countUrl、回调身份、view.condition 变化时重新计数，不提供取消、过期响应抑制或 catch UI，应用回调需处理失败。名称编辑器使用本地初始状态，cancel 从 view 恢复；不要假设每个 default prop 变化都会立即覆盖编辑输入。

服务端命令/可见性确认见 [FetcherViewer](./fetcher-viewer)。完全本地应用可维护 ViewState 数组并对所选存储实现 mutation。以下示例只在传入持久化函数完成后关闭，失败时显示错误并保留输入。

## 完整示例

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

## 公开签名与类型

以下签名按当前根入口可达声明核对。`?` 表示可省略；泛型/接口只约束编译期，继承项与关联类型可从 [符号索引](./index#public-symbols) 定位。运行时默认值和失败行为以本页上文为准。

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

## 相关专题

[模型与状态所有权](./models-and-state) · [View 与 Viewer 组合](./view-and-viewer) · [FetcherViewer 远端集成](./fetcher-viewer) · [过滤器与可编辑面板](./filters) · [表格、列与单元格](./tables-and-cells) · [注册表、输入与全屏按钮](./registries-and-inputs) · [工具栏、刷新与本地化](./toolbar-and-locale)
