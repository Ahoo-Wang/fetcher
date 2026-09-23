/*
 * Copyright [2021-present] [ahoo wang <ahoowang@qq.com> (https://github.com/Ahoo-Wang)].
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *      http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  DashboardViewRuntime,
  type DashboardViewConfig,
  type ViewEngine,
} from '@ahoo-wang/fetcher-view-engine';
import { useDashboard } from '@ahoo-wang/fetcher-view-engine/react';
import {
  DashboardWorkbench,
  panelOffers,
  type DashboardBuilding,
} from '@ahoo-wang/fetcher-view-engine/ui';
import { AppShell } from '../shared/AppShell.js';
import {
  HOST_LANGUAGE,
  analysisConfig,
  createStoryEngine,
  dashboardConfig,
  savedDashboard,
  savedViews,
} from './fixtures.js';
import { StoryEngine } from './StoryEngine.js';
import '@ahoo-wang/fetcher-view-engine/styles.css';

/** Which board a story opens. */
type Variant = 'tabs' | 'owned' | 'plain';

/**
 * Two tabs: the outbound overview, and a second tab with one more analysis
 * — only the tab on screen runs.
 */
function tabbedConfig(): DashboardViewConfig {
  const base = dashboardConfig();
  return {
    ...base,
    tabs: [
      { id: 'tab-outbound', title: '出库' },
      { id: 'tab-status', title: '状态' },
    ],
    panels: [
      ...base.panels.map(panel => ({ ...panel, tab: 'tab-outbound' })),
      {
        id: 'by-status',
        kind: 'view',
        title: '按状态看金额',
        instanceId: 'orders-analysis',
        bindings: [{ globalField: 'region', panelField: 'warehouse' }],
        layout: { x: 0, y: 0, w: 12, h: 4 },
        tab: 'tab-status',
      },
    ],
  };
}

/** The overview with one analysis the board owns rather than refers to. */
function ownedConfig(): DashboardViewConfig {
  const base = dashboardConfig();
  return {
    ...base,
    panels: [
      ...base.panels,
      {
        id: 'owned',
        kind: 'view',
        title: '本板自建：订单数按仓库',
        owned: {
          definitionId: 'orders',
          config: analysisConfig({
            chart: {
              type: 'bar',
              cartesian: { x: 'warehouse', series: [{ metric: 'orders' }] },
            },
          }),
        },
        bindings: [{ globalField: 'region', panelField: 'warehouse' }],
        layout: { x: 8, y: 4, w: 16, h: 4 },
      },
    ],
  };
}

function configOf(variant: Variant): DashboardViewConfig {
  if (variant === 'tabs') return tabbedConfig();
  if (variant === 'owned') return ownedConfig();
  return dashboardConfig();
}

/**
 * The board as a host puts it on a page, with what batch B3 adds to
 * building it: a new analysis made inside the dashboard, a panel's own look,
 * saving an owned analysis as a view, and tabs.
 *
 * The edit bar and the panel menu those commands belong on are batch B2's;
 * until they land, the row above the board — 「故事入口」 — is where a story
 * reaches the commands (`onBuildingChange`) and enters the building state,
 * and it shows the tab the workbench would write into the address
 * (`onTabChange`). A 「重新打开」 opens the board again, where its reader
 * last left it.
 */
function DashboardBuildingDemo({ variant = 'plain' }: { variant?: Variant }) {
  const [building, setBuilding] = useState<DashboardBuilding | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [opening, setOpening] = useState(0);
  return (
    <StoryEngine
      create={() =>
        createStoryEngine({
          instances: [
            ...savedViews,
            { ...savedDashboard, scope: 'shared', config: configOf(variant) },
          ],
        })
      }
    >
      {engine => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <StoryEntries
            engine={engine}
            building={building}
            address={address}
            onReopen={() => setOpening(count => count + 1)}
          />
          <DashboardWorkbench
            key={opening}
            engine={engine}
            definitionId="overview"
            instanceId={savedDashboard.id}
            editable
            onBuildingChange={setBuilding}
            onTabChange={setAddress}
            {...HOST_LANGUAGE}
          />
        </div>
      )}
    </StoryEngine>
  );
}

/** The board this engine has open, if any. */
function openBoard(engine: ViewEngine): DashboardViewRuntime | null {
  return (
    engine
      .openRuntimes()
      .find(
        (runtime): runtime is DashboardViewRuntime =>
          runtime instanceof DashboardViewRuntime,
      ) ?? null
  );
}

/** A story's way to what B2's edit bar and panel menu will offer. */
function StoryEntries({
  engine,
  building,
  address,
  onReopen,
}: {
  engine: ViewEngine;
  building: DashboardBuilding | null;
  address: string | null;
  onReopen(): void;
}) {
  const [board, setBoard] = useState<DashboardViewRuntime | null>(null);
  const dashboard = useDashboard(board);
  const [panelId, setPanelId] = useState('');
  const [tabId, setTabId] = useState('');
  const chosen = dashboard.panels.find(panel => panel.id === panelId);
  const offers = chosen ? panelOffers(chosen, dashboard) : null;
  const toggle = () => {
    const open = openBoard(engine);
    setBoard(open);
    open?.setEditing(!open.getSnapshot().editing);
  };
  return (
    <section
      aria-label="故事入口"
      data-story-entries
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: 8,
        padding: '8px 16px',
        font: '13px system-ui, sans-serif',
      }}
    >
      <button type="button" onClick={toggle}>
        {building ? '结束搭建' : '开始搭建'}
      </button>
      <button
        type="button"
        disabled={!building}
        onClick={() => building?.onAddOwnedAnalysis()}
      >
        新建分析…
      </button>
      <label>
        面板{' '}
        <select
          value={panelId}
          onChange={event => setPanelId(event.target.value)}
        >
          <option value="">（选一个）</option>
          {dashboard.panels.map(panel => (
            <option key={panel.id} value={panel.id}>
              {panel.title ?? panel.id}
            </option>
          ))}
        </select>
      </label>
      <button
        type="button"
        disabled={!building || !offers?.presentation}
        onClick={() => building?.onEditPresentation(panelId)}
      >
        改这里的展示…
      </button>
      <button
        type="button"
        disabled={!building || !offers?.reset}
        onClick={() => building?.onResetPresentation(panelId)}
      >
        恢复为视图的样子
      </button>
      <button
        type="button"
        disabled={!building || !offers?.saveAsView}
        onClick={() => building?.onSaveOwnedAsView(panelId)}
      >
        另存为视图…
      </button>
      <label>
        移到标签页{' '}
        <select value={tabId} onChange={event => setTabId(event.target.value)}>
          <option value="">（选一个）</option>
          {(offers?.tabs ?? []).map(tab => (
            <option key={tab.id} value={tab.id}>
              {tab.title}
            </option>
          ))}
        </select>
      </label>
      <button
        type="button"
        disabled={!building || !tabId}
        onClick={() => {
          building?.onMovePanelToTab(panelId, tabId);
          setTabId('');
        }}
      >
        移过去
      </button>
      <button type="button" onClick={onReopen}>
        重新打开
      </button>
      <span data-story-address>地址里的标签页：{address ?? '（无）'}</span>
    </section>
  );
}

const FIXTURE = '内存 ViewStore · 被引用的共享视图 · 一个板内分析 / 两个标签页';

const description = `**仪表盘视图 · 搭板子（批 B3）**

在仪表盘里新建分析、改一个面板的展示、把板内分析另存为视图、标签页。

- **数据源**：${FIXTURE}。
- **准备**：每次挂载都新建引擎与存储。编辑条与面板菜单是批 B2 的；它们到位之前，看板上方的「故事入口」一行就是这些命令的入口，并显示工作台会写进地址的当前标签页。
- **操作**：「开始搭建」进入搭的状态；选一个面板再按它能用的命令；在标签栏上加、改名、拖动或用方向键排序、删除标签页。
- **观察**：换图型只重画不重跑；只有屏幕上的标签页在跑；「重新打开」回到上次看的标签页。`;

const meta = {
  parameters: {
    layout: 'fullscreen',
    docs: { description: { component: description } },
  },
  decorators: [
    Story => (
      <AppShell current="dashboard" service={{ fixture: FIXTURE }}>
        <Story />
      </AppShell>
    ),
  ],
  title: 'View Engine/仪表盘视图/搭板子',
  component: DashboardBuildingDemo,
  args: { variant: 'plain' },
  argTypes: { variant: { table: { disable: true } } },
} satisfies Meta<typeof DashboardBuildingDemo>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The overview board: make a new analysis on it, or change a panel's look. */
export const Overview: Story = {
  name: '新建分析与改展示',
  args: { variant: 'plain' },
};

/** A board that owns one analysis, which can be saved as a view of its own. */
export const OwnedAnalysis: Story = {
  name: '板内分析另存为视图',
  args: { variant: 'owned' },
};

/** Two tabs: only the one on screen runs, and the last one read is kept. */
export const Tabs: Story = { name: '标签页', args: { variant: 'tabs' } };
