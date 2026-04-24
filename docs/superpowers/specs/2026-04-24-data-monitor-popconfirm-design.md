# DataMonitorBarItem Popconfirm 二次确认设计

## 概述

为 `DataMonitorBarItem` 组件添加 Popconfirm 二次确认功能，用户在开启或关闭数据监控时需要确认操作。

## 需求

- 用户点击图标开启监控时，弹出确认框
- 用户点击图标关闭监控时，弹出确认框
- 用户点"确认"才执行切换操作
- 用户点"取消"无操作

## UI/UX 设计

### 交互流程

```
用户点击图标
    ↓
弹出 Popconfirm 确认框
    ↓
┌─────────────────────────────┐
│ title: 确认开启/关闭数据监控？  │
│ description: 提示文案          │
│ [取消]              [确认]   │
└─────────────────────────────┘
    ↓                    ↓
  无操作              执行 toggle
```

### 文案

| 状态 | title | description |
|------|--------|-------------|
| 开启前 (isEnabled=false) | "确认开启数据监控？" | "开启后将定期检测数据变化并通知" |
| 关闭前 (isEnabled=true) | "确认关闭数据监控？" | "关闭后将不再接收数据变化通知" |

## 技术实现

### 修改文件

- `packages/viewer/src/topbar/DataMonitorBarItem.tsx`

### 实现方案

使用 Ant Design 的 `Popconfirm` 组件包裹 `BarItem`：

```tsx
<Tooltip placement="top" title={isEnabled ? '关闭数据监控' : '开启数据监控'}>
  <Popconfirm
    title={isEnabled ? '确认关闭数据监控？' : '确认开启数据监控？'}
    description={isEnabled ? '关闭后将不再接收数据变化通知' : '开启后将定期检测数据变化并通知'}
    onConfirm={toggle}
    okText="确认"
    cancelText="取消"
  >
    <div>
      <BarItem
        icon={<BellOutlined />}
        active={isEnabled}
        {...rest}
      />
    </div>
  </Popconfirm>
</Tooltip>
```

## 测试要点

1. 点击已启用状态的图标，弹出确认框
2. 点击已禁用状态的图标，弹出确认框
3. 点"确认"后，状态正确切换
4. 点"取消"后，状态不变
5. Tooltip 仍然正常显示
