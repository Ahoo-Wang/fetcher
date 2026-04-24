# DataMonitorBarItem Popconfirm 二次确认实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 DataMonitorBarItem 添加 Popconfirm 二次确认，用户开启或关闭监控时需要确认

**Architecture:** 使用 Ant Design Popconfirm 组件包裹 BarItem，点击时弹出确认框

**Tech Stack:** React, Ant Design Popconfirm

---

## 文件清单

- **修改:** `packages/viewer/src/topbar/DataMonitorBarItem.tsx`
- **修改:** `packages/viewer/test/topbar/DataMonitorBarItem.test.tsx`
- **修改:** `packages/viewer/src/topbar/stories/DataMonitorBarItem.stories.tsx`

---

## Task 1: 添加 Popconfirm 到 DataMonitorBarItem

- [ ] **Step 1: 修改 DataMonitorBarItem.tsx，添加 Popconfirm**

修改 `packages/viewer/src/topbar/DataMonitorBarItem.tsx`:

```tsx
import { BellOutlined } from '@ant-design/icons';
import { Tooltip, Popconfirm } from 'antd';
import type { Condition } from '@ahoo-wang/fetcher-wow';
import { BarItem } from './BarItem';
import {
  useDataMonitor,
  type DataMonitorNotificationConfig,
} from '@ahoo-wang/fetcher-react';
import type { TopBarItemProps } from './types';

export interface DataMonitorBarItemProps extends TopBarItemProps {
  viewId: string;
  countUrl: string;
  viewName: string;
  condition: Condition;
  notification: DataMonitorNotificationConfig;
  interval?: number;
}

export function DataMonitorBarItem(props: DataMonitorBarItemProps) {
  const { viewId, countUrl, viewName, condition, notification, interval, ...rest } = props;

  const { isEnabled, toggle } = useDataMonitor({
    viewId,
    countUrl,
    viewName,
    condition,
    notification,
    interval,
  });

  return (
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
  );
}
```

主要变更：
1. 引入 `Popconfirm` from 'antd'
2. 引入 `BellOutlined` (移除 `BellFilled`)
3. 用 `Popconfirm` 包裹内容，`onConfirm={toggle}`
4. 根据 `isEnabled` 显示不同文案

- [ ] **Step 2: 运行 TypeScript 检查**

```bash
cd D:/workspace/code/linyi/front/fetcher && pnpm tsc --noEmit -p packages/viewer/tsconfig.json
```

- [ ] **Step 3: 提交**

```bash
git add packages/viewer/src/topbar/DataMonitorBarItem.tsx
git commit -m "feat(viewer): add Popconfirm confirmation to DataMonitorBarItem"
```

---

## Task 2: 更新单元测试

- [ ] **Step 1: 修改测试文件**

修改 `packages/viewer/test/topbar/DataMonitorBarItem.test.tsx`：

```tsx
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, fireEvent, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { DataMonitorBarItem } from '../../src/topbar/DataMonitorBarItem';
import { Popconfirm } from 'antd';

const mockToggle = vi.fn();

vi.mock('@ahoo-wang/fetcher-react', () => ({
  useDataMonitor: vi.fn(() => ({
    isEnabled: false,
    toggle: mockToggle,
  })),
}));

const defaultProps = {
  viewId: 'test-view',
  countUrl: '/api/count',
  viewName: 'Test View',
  condition: {},
  notification: { title: 'Test Notification' },
};

describe('DataMonitorBarItem', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render without crashing', () => {
      const { container } = render(<DataMonitorBarItem {...defaultProps} />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should render Bell icon', () => {
      const { container } = render(<DataMonitorBarItem {...defaultProps} />);
      expect(container.querySelector('[role="img"]')).toBeInTheDocument();
    });

    it('should render Popconfirm', () => {
      const { container } = render(<DataMonitorBarItem {...defaultProps} />);
      expect(container.querySelector('.ant-popconfirm')).toBeInTheDocument();
    });
  });

  describe('click behavior - Popconfirm', () => {
    it('should show Popconfirm when clicked', () => {
      const { container } = render(<DataMonitorBarItem {...defaultProps} />);

      const div = container.querySelector('div');
      fireEvent.click(div!);

      expect(screen.queryByText('确认开启数据监控？')).toBeInTheDocument();
    });

    it('should call toggle when Popconfirm is confirmed', () => {
      const { container } = render(<DataMonitorBarItem {...defaultProps} />);

      const div = container.querySelector('div');
      fireEvent.click(div!);

      const confirmButton = container.querySelector('.ant-popconfirm .ant-btn-primary');
      fireEvent.click(confirmButton!);

      expect(mockToggle).toHaveBeenCalledTimes(1);
    });

    it('should not call toggle when Popconfirm is cancelled', () => {
      const { container } = render(<DataMonitorBarItem {...defaultProps} />);

      const div = container.querySelector('div');
      fireEvent.click(div!);

      const cancelButton = container.querySelector('.ant-popconfirm .ant-btn-default');
      fireEvent.click(cancelButton!);

      expect(mockToggle).not.toHaveBeenCalled();
    });
  });

  describe('enabled state', () => {
    it('should show "确认关闭" when enabled', () => {
      vi.mocked(useDataMonitor).mockReturnValueOnce({
        isEnabled: true,
        toggle: mockToggle,
      });

      const { container } = render(<DataMonitorBarItem {...defaultProps} />);

      const div = container.querySelector('div');
      fireEvent.click(div!);

      expect(screen.queryByText('确认关闭数据监控？')).toBeInTheDocument();
    });
  });
});
```

- [ ] **Step 2: 运行测试**

```bash
cd D:/workspace/code/linyi/front/fetcher && pnpm test:unit -- --run packages/viewer/test/topbar/DataMonitorBarItem.test.tsx
```

- [ ] **Step 3: 提交**

```bash
git add packages/viewer/test/topbar/DataMonitorBarItem.test.tsx
git commit -m "test(viewer): add Popconfirm tests for DataMonitorBarItem"
```

---

## Task 3: 更新 Storybook

- [ ] **Step 1: 修改 storybook 中的 Popconfirm 文案**

修改 `packages/viewer/src/topbar/stories/DataMonitorBarItem.stories.tsx` 中的 `WithNotificationDemo` story：

更新 `handleSimulateNotification` 中的 `notificationCenter.publish` 调用（如果需要）

- [ ] **Step 2: 运行 Storybook 检查**

```bash
cd D:/workspace/code/linyi/front/fetcher && pnpm storybook --version
```

- [ ] **Step 3: 提交**

```bash
git add packages/viewer/src/topbar/stories/DataMonitorBarItem.stories.tsx
git commit -m "docs(viewer): update DataMonitorBarItem storybook for Popconfirm"
```

---

## 验证步骤

1. 运行 `pnpm tsc --noEmit -p packages/viewer/tsconfig.json` 确保无类型错误
2. 运行 `pnpm test:unit -- --run packages/viewer/test/topbar/DataMonitorBarItem.test.tsx` 确保测试通过
3. 运行 `pnpm storybook` 手动验证 UI 行为
