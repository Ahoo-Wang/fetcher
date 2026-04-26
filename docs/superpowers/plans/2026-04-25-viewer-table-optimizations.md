# Viewer Table 模块优化实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 优化 `@ahoo-wang/fetcher-viewer` 的 table 模块，提升安全性、性能、可维护性、可访问性和国际化支持。

**Architecture:** 优化遵循以下原则：
- P0 安全问题立即修复
- P1 性能问题优先处理（useMemo、useCallback）
- P2 渐进式改进（i18n、a11y）
- 所有修改需有测试覆盖

**Tech Stack:** React 18, Ant Design Table, Vitest

---

## 文件影响范围

```
packages/viewer/src/table/
├── ViewTable.tsx                    # 主表格组件（优化重点）
├── ViewTable.module.css
├── types.ts
├── hooks/
│   └── useViewTableState.ts         # 状态 Hook
├── cell/
│   ├── index.ts
│   ├── types.ts                     # CellProps, CellData 类型
│   ├── TypedCell.tsx                # 渲染工厂
│   ├── TextCell.tsx                 # 文本单元格
│   ├── LinkCell.tsx                 # 链接单元格
│   ├── TagCell.tsx                  # 标签单元格
│   ├── TagsCell.tsx                 # 多标签单元格
│   ├── DateTimeCell.tsx             # 日期时间单元格
│   ├── CalendarTime.tsx             # 日历时间单元格
│   ├── ImageCell.tsx
│   ├── ImageGroupCell.tsx
│   ├── AvatarCell.tsx
│   ├── ActionCell.tsx               # 单操作按钮
│   ├── ActionsCell.tsx              # 多操作按钮
│   ├── PrimaryKeyCell.tsx
│   ├── utils.ts                     # 工具函数
│   └── currencyFormatter.ts         # 货币格式化
├── setting/
│   ├── TableSettingPanel.tsx        # 设置面板
│   ├── TableFieldItem.tsx           # 字段项
│   └── *.module.css
```

---

## 优先级 P0：安全

### Task 1: 修复 LinkCell 缺少 rel="noopener noreferrer" 安全问题

**背景分析：**

- **TextCell 无 XSS 漏洞**：TextCell 使用 React JSX 子节点渲染（`{displayValue}`），React 自动转义，不存在 XSS 风险。无需引入 DOMPurify。
- **LinkCell 的 `isSafeUrl` 已存在**：当前代码 LinkCell.tsx:24-32 已实现危险协议过滤。无需添加。
- **真正的安全问题**：LinkCell 对非邮箱链接自动添加 `target="_blank"`（LinkCell.tsx:157），但没有同步添加 `rel="noopener noreferrer"`，存在 **tabnabbing 攻击** 风险——新页面可通过 `window.opener` 将当前页导航到钓鱼页面。

**Files:**
- Modify: `packages/viewer/src/table/cell/LinkCell.tsx`
- Test: `packages/viewer/test/table/cell/LinkCell.test.tsx`

- [ ] **Step 1: 创建 rel 安全属性测试**

```typescript
// 在现有 LinkCell.test.tsx 中追加
describe('LinkCell 安全属性', () => {
  it('非邮箱链接自动添加 target="_blank" 时应包含 rel="noopener noreferrer"', () => {
    const { container } = render(
      <LinkCell
        data={{ value: 'https://example.com', record: {}, index: 0 }}
        attributes={{}}
      />
    );
    const link = container.querySelector('a');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('用户显式设置 rel 时应保留用户的值', () => {
    const { container } = render(
      <LinkCell
        data={{ value: 'https://example.com', record: {}, index: 0 }}
        attributes={{ rel: 'nofollow' }}
      />
    );
    const link = container.querySelector('a');
    expect(link).toHaveAttribute('rel', 'nofollow');
  });

  it('邮箱链接不需要 rel 属性', () => {
    const { container } = render(
      <LinkCell
        data={{ value: 'user@example.com', record: {}, index: 0 }}
        attributes={{}}
      />
    );
    const link = container.querySelector('a');
    expect(link).not.toHaveAttribute('target');
  });

  it('阻止 javascript: 协议', () => {
    render(
      <LinkCell
        data={{ value: 'Click', record: {}, index: 0 }}
        attributes={{ href: 'javascript:alert("xss")' }}
      />
    );
    const link = screen.getByRole('link');
    expect(link.getAttribute('href')).toBe('#');
  });
});
```

- [ ] **Step 2: 运行测试验证失败**

Run: `pnpm vitest run packages/viewer/test/table/cell/LinkCell.test.tsx`
Expected: FAIL - 缺少 rel="noopener noreferrer"

- [ ] **Step 3: 修复 LinkCell**

```typescript
// packages/viewer/src/table/cell/LinkCell.tsx
export function LinkCell<RecordType = any>(props: LinkCellProps<RecordType>) {
  const { data, attributes = {} } = props;

  const isEmail = data.value && EMAIL_REGEX.test(data.value);
  let href =
    attributes?.href ?? (isEmail ? `${EMAIL_PREFIX}${data.value}` : data.value);

  if (!isSafeUrl(href)) {
    href = '#';
  }

  const linkProps = isEmail
    ? attributes
    : {
        ...attributes,
        ...(attributes?.target === undefined ? { target: '_blank' } : {}),
        // 安全修复：搭配 target="_blank" 时自动添加 rel="noopener noreferrer"
        ...(attributes?.rel === undefined && attributes?.target === undefined
          ? { rel: 'noopener noreferrer' }
          : {}),
      };

  return (
    <Link href={href} {...linkProps}>
      {attributes?.children ?? data.value}
    </Link>
  );
}
```

- [ ] **Step 4: 运行测试验证通过**

Run: `pnpm vitest run packages/viewer/test/table/cell/LinkCell.test.tsx`
Expected: PASS

---

### Task 2: 添加 isSafeUrl 独立单元测试

`isSafeUrl` 是关键安全函数，当前仅在 LinkCell 内部间接测试，需要独立的单元测试覆盖。

**Files:**
- Test: `packages/viewer/test/table/cell/LinkCell.test.tsx`（追加）

- [ ] **Step 1: 添加 isSafeUrl 安全过滤测试**

```typescript
describe('LinkCell isSafeUrl 安全过滤', () => {
  it.each([
    ['javascript:alert(1)', '#'],
    ['javascript:void(0)', '#'],
    ['JAVASCRIPT:alert(1)', '#'],
    ['data:text/html,<script>alert(1)</script>', '#'],
    ['DATA:text/html,<script>alert(1)</script>', '#'],
    ['vbscript:msgbox(1)', '#'],
    ['VBSCRIPT:msgbox(1)', '#'],
    ['', '#'],  // 空字符串不安全，应回退到 #
  ])('危险 URL "%s" 应退回到 "#"', (input, expected) => {
    const { container } = render(
      <LinkCell
        data={{ value: 'Click', record: {}, index: 0 }}
        attributes={{ href: input }}
      />
    );
    expect(container.querySelector('a')).toHaveAttribute('href', expected);
  });
});
```

- [ ] **Step 2: 运行测试**

Run: `pnpm vitest run packages/viewer/test/table/cell/LinkCell.test.tsx`
Expected: PASS（现有 isSafeUrl 已正确处理这些情况）

---

## 优先级 P1：性能优化

### Task 3: 优化 ViewTable 渲染性能

**背景分析：**

- **Cell 组件不应加 React.memo**：Ant Design Table 内部已做渲染优化；且 Cell 每次收到新 `data`/`attributes` 对象引用，memo 浅比较永不命中，白加开销。
- **真正的性能瓶颈在 ViewTable 层**：`tableColumns.map` 中的 `render` 闭包和 `fieldMap`、`typedCellRender` 调用每次都重建。

**Files:**
- Modify: `packages/viewer/src/table/ViewTable.tsx`
- Modify: `packages/viewer/src/table/hooks/useViewTableState.ts`

- [ ] **Step 1: 优化 useViewTableState — 使用 useCallback 稳定函数引用**

```typescript
// packages/viewer/src/table/hooks/useViewTableState.ts
import type { Key } from 'react';
import { useState, useCallback } from 'react';

export function useViewTableState(): ViewTableStateReturn {
  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([]);

  const clearSelectedRowKeys = useCallback(() => {
    setSelectedRowKeys([]);
  }, []);

  const reset = useCallback(() => {
    setSelectedRowKeys([]);
  }, []);

  return {
    selectedRowKeys,
    setSelectedRowKeys,
    clearSelectedRowKeys,
    reset,
  };
}
```

- [ ] **Step 2: 优化 ViewTable — useMemo 缓存 fieldMap 和 tableColumns**

```typescript
// packages/viewer/src/table/ViewTable.tsx
import { useMemo, useCallback } from 'react';

export function ViewTable<RecordType>(props: ViewTableProps<RecordType>) {
  const { /* ... */ } = props;

  const { selectedRowKeys, setSelectedRowKeys, reset, clearSelectedRowKeys } =
    useViewTableState();

  // 缓存 fieldMap，避免每次 render 重建
  const fieldMap = useMemo(
    () => new Map(fields.map(f => [f.name, f])),
    [fields],
  );

  // 缓存 tableColumns，减少不必要的列重建
  const tableColumns: TableColumnsType<RecordType> = useMemo(() => {
    return columns.map(col => {
      const columnDefinition = fieldMap.get(col.name);
      return {
        key: col.key,
        title: columnDefinition?.label || 'UNKNOWN',
        dataIndex: col.name.split('.'),
        fixed: columnDefinition?.primaryKey ? 'start' : col?.fixed ? 'start' : '',
        sorter: columnDefinition?.sorter,
        defaultSortOrder: col.sortOrder,
        width: col.width,
        hidden: col.hidden,
        render: (value: any, record: RecordType, index: number) => {
          if (columnDefinition?.render) {
            return columnDefinition.render(value, record, index);
          }
          if (columnDefinition?.primaryKey) {
            return (
              <PrimaryKeyCell
                data={{ value, record, index }}
                attributes={{
                  onClick: (record: RecordType) => {
                    onClickPrimaryKey?.(value, record);
                  },
                  copyable: true,
                  ...columnDefinition.attributes,
                }}
              />
            );
          }
          const cellRender = typedCellRender(
            columnDefinition?.type || 'text',
            columnDefinition?.attributes || {},
          );
          if (cellRender) {
            return cellRender(value, record, index);
          }
          return <TextCell data={{ value: String(value), record, index }} />;
        },
        ...(columnDefinition?.attributes || {}),
      };
    });
  }, [columns, fieldMap, onClickPrimaryKey]);

  // useCallback 稳定 onChange 引用
  const handleTableChange = useCallback(
    (_pagination, _filters, sorter, extra) => {
      if (extra.action === 'sort' && onSortChanged) {
        if (Array.isArray(sorter)) {
          onSortChanged(sorter);
        } else {
          onSortChanged([sorter]);
        }
      }
    },
    [onSortChanged],
  );

  // ... actionColumn 追加逻辑也需包裹在 useMemo 中（如有需要）

  return (
    <Table<RecordType>
      loading={loading}
      dataSource={mapToTableRecord(dataSource)}
      rowSelection={rowSelection}
      columns={tableColumns}
      {...attributes}
      scroll={{ x: 'max-content' }}
      size={tableSize || 'middle'}
      onChange={handleTableChange}
    />
  );
}
```

- [ ] **Step 3: 运行测试验证**

Run: `pnpm vitest run packages/viewer/test/table/ViewTable.test.tsx`
Expected: PASS

---

### Task 4: 修复 TextCell 边界情况（0/false 被错误显示为 "-"）

**背景分析：**

- TextCell 当前使用 `data.value || '-'`（TextCell.tsx:121），导致 `0` 和 `false` 被错误显示为 `-`
- 简单的 `??` 替换不够——`??` 会让空字符串 `''` 显示为空白而非 `-`
- TagCell 当前 `!data.value?.trim()` 已正确处理空白值，无需修改
- DateTimeCell 当前已有 `!data.value` 的早期返回处理，只需加 try-catch 包裹 `parseDayjs`/`format` 调用

**Files:**
- Modify: `packages/viewer/src/table/cell/TextCell.tsx`
- Modify: `packages/viewer/src/table/cell/DateTimeCell.tsx`
- Test: `packages/viewer/test/table/cell/EdgeCases.test.tsx`（新建）

- [ ] **Step 1: 创建边界情况测试**

```typescript
// packages/viewer/test/table/cell/EdgeCases.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TextCell } from '../../src/table/cell/TextCell';
import { DateTimeCell } from '../../src/table/cell/DateTimeCell';

describe('Cell 边界情况', () => {
  describe('TextCell', () => {
    it('value 为 0 时应显示 "0"', () => {
      render(<TextCell data={{ value: 0 as any, record: {}, index: 0 }} attributes={{}} />);
      expect(screen.getByText('0')).toBeInTheDocument();
    });

    it('value 为 false 时应显示 "false"', () => {
      render(<TextCell data={{ value: false as any, record: {}, index: 0 }} attributes={{}} />);
      expect(screen.getByText('false')).toBeInTheDocument();
    });

    it('value 为空字符串时应显示 "-"', () => {
      render(<TextCell data={{ value: '', record: {}, index: 0 }} attributes={{}} />);
      expect(screen.getByText('-')).toBeInTheDocument();
    });

    it('value 为 null 时应显示 "-"', () => {
      render(<TextCell data={{ value: null as any, record: {}, index: 0 }} attributes={{}} />);
      expect(screen.getByText('-')).toBeInTheDocument();
    });

    it('value 为 undefined 时应显示 "-"', () => {
      render(<TextCell data={{ value: undefined as any, record: {}, index: 0 }} attributes={{}} />);
      expect(screen.getByText('-')).toBeInTheDocument();
    });
  });

  describe('DateTimeCell', () => {
    it('解析无效日期时应显示 "-" 而不是崩溃', () => {
      const { container } = render(
        <DateTimeCell data={{ value: 'not-a-date', record: {}, index: 0 }} attributes={{}} />
      );
      expect(container.querySelector('.ant-typography')?.textContent).toBe('-');
    });
  });
});
```

- [ ] **Step 2: 运行测试验证失败**

Run: `pnpm vitest run packages/viewer/test/table/cell/EdgeCases.test.tsx`
Expected: TextCell 0/false 测试 FAIL

- [ ] **Step 3: 修复 TextCell**

```typescript
// packages/viewer/src/table/cell/TextCell.tsx
export function TextCell<RecordType = any>(props: TextCellProps<RecordType>) {
  // 修复：仅 null/undefined/空字符串显示 "-"，0 和 false 正常显示
  const displayValue = (props.data.value === null || props.data.value === undefined || props.data.value === '')
    ? '-'
    : String(props.data.value);
  return <Text {...props.attributes}>{props.attributes?.children ?? displayValue}</Text>;
}
```

- [ ] **Step 4: 修复 DateTimeCell — 添加 try-catch**

```typescript
// packages/viewer/src/table/cell/DateTimeCell.tsx
export function DateTimeCell<RecordType = any>(
  props: DateTimeCellProps<RecordType>,
) {
  const { data, attributes = {} } = props;
  const { format = DEFAULT_DATE_TIME_FORMAT, ...textProps } = attributes;
  if (!data.value) {
    return <Text {...textProps}>-</Text>;
  }

  try {
    const date = parseDayjs(data.value);
    if (!date.isValid()) {
      return <Text {...textProps}>-</Text>;
    }
    if (typeof format === 'function') {
      return <Text {...textProps}>{format(date)}</Text>;
    }
    return <Text {...textProps}>{date.format(format)}</Text>;
  } catch {
    return <Text {...textProps}>-</Text>;
  }
}
```

- [ ] **Step 5: 运行测试验证**

Run: `pnpm vitest run packages/viewer/test/table/cell/EdgeCases.test.tsx`
Expected: PASS

---

## 优先级 P2：国际化与可访问性

### Task 5: 提取 TableSettingPanel 硬编码中文

**Files:**
- Modify: `packages/viewer/src/table/setting/TableSettingPanel.tsx`
- Create: `packages/viewer/src/table/setting/tableLocale.ts`
- Test: `packages/viewer/test/table/setting/TableSettingPanel.test.tsx`

- [ ] **Step 1: 创建国际化文案模块**

```typescript
// packages/viewer/src/table/setting/tableLocale.ts
export const tableLocale = {
  'zh-CN': {
    visibleFields: '已显示字段',
    hiddenFields: '未显示字段',
    fixedTip: '请将需要锁定的字段拖至上方（最多支持3列）',
  },
  'en-US': {
    visibleFields: 'Visible Fields',
    hiddenFields: 'Hidden Fields',
    fixedTip: 'Drag fields here to pin them (max 3 columns)',
  },
} as const;

export function t(
  key: keyof typeof tableLocale['en-US'],
  locale = 'zh-CN',
): string {
  return (tableLocale[locale as keyof typeof tableLocale] as any)?.[key]
    || tableLocale['zh-CN'][key]
    || key;
}
```

- [ ] **Step 2: 修改 TableSettingPanel 替换硬编码文本**

```typescript
// packages/viewer/src/table/setting/TableSettingPanel.tsx
import { t } from './tableLocale';

// 替换硬编码：
// '已显示字段' → {t('visibleFields')}
// '请将需要锁定的字段拖至上方（最多支持3列）' → {t('fixedTip')}
// '未显示字段' → {t('hiddenFields')}
```

- [ ] **Step 3: 运行测试**

Run: `pnpm vitest run packages/viewer/test/table/setting/TableSettingPanel.test.tsx`
Expected: PASS

---

### Task 6: 增强拖拽排序的键盘支持

**Files:**
- Modify: `packages/viewer/src/table/setting/TableSettingPanel.tsx`
- Test: `packages/viewer/test/table/setting/TableSettingPanel.test.tsx`

- [ ] **Step 1: 创建键盘 a11y 测试**

```typescript
// packages/viewer/test/table/setting/TableSettingPanel.test.tsx 追加
import userEvent from '@testing-library/user-event';

describe('TableSettingPanel 键盘导航', () => {
  it('应支持 Space/Enter 键切换字段可见性', async () => {
    // 测试空格键可以切换字段可见性
  });

  it('应支持 Alt+ArrowUp/ArrowDown 移动字段顺序', async () => {
    // 测试 Alt+方向键可以重新排序字段
  });
});
```

- [ ] **Step 2: 实现键盘支持**

为拖拽项添加 `role="listitem"`、`tabIndex={0}` 和 `onKeyDown` 处理：
- `Alt + ArrowUp`：向上移动列
- `Alt + ArrowDown`：向下移动列
- `Space` / `Enter`：切换可见性

- [ ] **Step 3: 运行测试**

Run: `pnpm vitest run packages/viewer/test/table/setting/TableSettingPanel.test.tsx`

---

## 优先级 P3：可维护性与测试补充

### Task 7: 添加 Cell 组件类型签名测试

虽然 ActionCell 与 ActionsCell 的 onClick 签名差异属于设计层面（单操作 vs 多操作），但缺少测试验证会导致未来回归。

**Files:**
- Test: `packages/viewer/test/table/cell/ActionCell.test.tsx`（追加）
- Test: `packages/viewer/test/table/cell/ActionsCell.test.tsx`（追加）
- Test: `packages/viewer/test/table/cell/PrimaryKeyCell.test.tsx`（追加）

- [ ] **Step 1: 创建签名测试**

```typescript
// ActionCell.test.tsx 追加
it('onClick 回调应接收完整 record', async () => {
  const mockRecord = { id: 1, name: 'Test' };
  const onClick = vi.fn();
  render(
    <ActionCell
      data={{ value: 'Edit', record: mockRecord, index: 0 }}
      attributes={{ onClick }}
    />
  );
  await userEvent.click(screen.getByRole('button'));
  expect(onClick).toHaveBeenCalledWith(mockRecord);
});

// PrimaryKeyCell.test.tsx 追加
it('onClick 回调应接收完整 record', async () => {
  const mockRecord = { id: 1, name: 'Test' };
  const onClick = vi.fn();
  render(
    <PrimaryKeyCell
      data={{ value: '1', record: mockRecord, index: 0 }}
      attributes={{ onClick }}
    />
  );
  await userEvent.click(screen.getByRole('link'));
  expect(onClick).toHaveBeenCalledWith(mockRecord);
});
```

- [ ] **Step 2: 运行测试**

Run: `pnpm vitest run packages/viewer/test/table/cell/ActionCell.test.tsx packages/viewer/test/table/cell/ActionsCell.test.tsx packages/viewer/test/table/cell/PrimaryKeyCell.test.tsx`
Expected: PASS

---

### Task 8: 清理过长的 JSDoc（可选，主观偏好）

**Files:**
- Modify: `packages/viewer/src/table/cell/*.tsx` (12 个组件文件)
- Modify: `packages/viewer/src/table/ViewTable.tsx`
- Modify: `packages/viewer/src/table/setting/TableSettingPanel.tsx`

将每个组件 80-120 行的 JSDoc 精简为 2-3 行：

```typescript
// 之前（~100 行）
/**
 * Renders a text cell using Ant Design's Typography.Text component.
 * This component displays string values...
 * @template RecordType ...
 * @param props ...
 * @returns ...
 * @example ... (多个 example)
 */

// 之后（3 行）
/** Text cell using Ant Design Typography.Text. */
```

- [ ] **Step 1: 精简所有 Cell 组件的 JSDoc**

---

## 设计决策记录

| # | 提议 | 决策 | 原因 |
|---|------|------|------|
| 1 | TextCell 加 DOMPurify 防 XSS | **不采纳** | React JSX 子节点自动转义，无 XSS 风险 |
| 2 | LinkCell 添加 `isSafeUrl` | **不采纳** | 代码中已存在（LinkCell.tsx:24-32） |
| 3 | 添加 `rel="noopener noreferrer"` | **新增** | `target="_blank"` 缺少此属性存在 tabnabbing 风险 |
| 4 | 所有 Cell 组件加 React.memo | **不采纳** | Ant Design Table 内部已优化；Cell 每次收到新 data/attributes 引用，memo 浅比较永不命中 |
| 5 | TypedCell Map 缓存 | **不采纳** | JSON.stringify 不可靠（函数丢失），无淘汰策略导致内存泄漏；改为 ViewTable 层 useMemo |
| 6 | `??` 替换 `\|\|` 修复 TextCell | **改进** | 需同时处理 `''` 显示 `-` 的现有行为，用三元表达式精确判断 |
| 7 | ViewTable useMemo 优化 | **扩展** | 补充 `fieldMap` 的 memo 化和 `handleTableChange` 的 useCallback |

---

## 总结

| Task | 优先级 | 描述 | 预计工作量 |
|------|--------|------|-----------|
| 1 | P0 | LinkCell 添加 rel="noopener noreferrer" | 小 |
| 2 | P0 | isSafeUrl 独立单元测试 | 小 |
| 3 | P1 | ViewTable useMemo + useCallback 优化 | 中 |
| 4 | P1 | TextCell/DateTimeCell 边界情况修复 | 小 |
| 5 | P2 | TableSettingPanel 国际化 | 中 |
| 6 | P2 | 键盘可访问性支持 | 中 |
| 7 | P3 | 类型签名回归测试 | 小 |
| 8 | P3 | JSDoc 精简（可选） | 小 |

---

**Plan self-review checklist:**
- [x] 真实安全漏洞已识别（rel/noopener），不存在的漏洞已排除
- [x] 无效优化已移除（React.memo on Cell、TypedCell Map 缓存）
- [x] 边界情况修复方案正确处理 `0`/`false`/`''`/`null`/`undefined`
- [x] fieldMap 和 handleTableChange 补充到性能优化任务中
- [x] 所有任务按优先级排列：P0 → P1 → P2 → P3

---

**Plan complete.** Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach?
