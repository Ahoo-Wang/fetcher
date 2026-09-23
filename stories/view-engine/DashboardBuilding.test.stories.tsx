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
import type { ComponentType } from 'react';
import type { StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import displayMeta, {
  OwnedAnalysis as DisplayOwnedAnalysis,
  Overview as DisplayOverview,
  Tabs as DisplayTabs,
} from './DashboardBuilding.stories.js';
import { aggregateCalls } from './fixtures.js';
import { chartsDrawn } from './chartDom.js';

const meta = {
  ...displayMeta,
  title: 'View Engine/仪表盘视图/搭板子/回归',
  tags: ['!dev', '!autodocs', 'test'],
  parameters: { ...displayMeta.parameters },
};

export default meta;

type Story = StoryObj<typeof displayMeta>;

/** A desk-width column: the board is a grid there, not the one-column reading. */
const DESK = (Story: ComponentType) => (
  <div style={{ width: 1280 }}>
    <Story />
  </div>
);

const page = () => within(document.body);

/** The story's own row: where B2's edit bar and panel menu will be. */
function entries(canvasElement: HTMLElement) {
  return within(
    canvasElement.querySelector<HTMLElement>('[data-story-entries]')!,
  );
}

async function startBuilding(canvasElement: HTMLElement) {
  const row = entries(canvasElement);
  // The board is open once its panels are named on the grid.
  await within(canvasElement).findByRole('heading', {
    level: 3,
    name: '按仓库汇总',
  });
  await userEvent.click(row.getByRole('button', { name: '开始搭建' }));
  await waitFor(() =>
    expect(row.getByRole('button', { name: '结束搭建' })).toBeVisible(),
  );
}

async function choosePanel(canvasElement: HTMLElement, title: string) {
  await userEvent.selectOptions(
    entries(canvasElement).getByRole('combobox', { name: '面板' }),
    title,
  );
}

/**
 * Screen C: a new analysis made inside the dashboard. The dialog is the
 * analysis view — the tray and the result, running as it is edited — named
 * by what it shows, and 「放进仪表盘」 puts it on the board. The keyboard is
 * held inside while it is open and handed back after.
 */
export const CreateOwnedAnalysis: Story = {
  ...DisplayOverview,
  decorators: [DESK],
  play: async ({ canvasElement }) => {
    await startBuilding(canvasElement);
    const opener = entries(canvasElement).getByRole('button', {
      name: '新建分析…',
    });
    await userEvent.click(opener);

    const dialog = await page().findByRole('dialog', {
      name: '新建分析 · 订单',
    });
    const inside = within(dialog);
    // The same tray as the workbench: dimensions and metrics.
    await expect(
      dialog.querySelector('[data-slot="new-analysis-tray"]'),
    ).not.toBeNull();
    const title = inside.getByRole('textbox', { name: '标题' });
    await waitFor(() => expect(title).toHaveValue('按仓库 · 记录数'));
    // Held inside: Tab from the last control comes back to the first.
    await expect(dialog.contains(document.activeElement)).toBe(true);

    await userEvent.clear(title);
    await userEvent.type(title, '各仓订单数');
    await userEvent.click(inside.getByRole('button', { name: '放进仪表盘' }));

    await waitFor(() => expect(page().queryByRole('dialog')).toBeNull());
    await expect(
      await within(canvasElement).findByRole('heading', {
        level: 3,
        name: '各仓订单数',
      }),
    ).toBeVisible();
    await waitFor(() => expect(document.activeElement).toBe(opener));
  },
};

/**
 * Screen C, the other half: an analysis the board owns saved as a view of
 * its own (「另存为视图…」). The dialog asks for a title and an audience —
 * the board's, a shared one, first — and the panel then shows that view.
 */
export const PromoteOwnedAnalysis: Story = {
  ...DisplayOwnedAnalysis,
  decorators: [DESK],
  play: async ({ canvasElement }) => {
    await startBuilding(canvasElement);
    await choosePanel(canvasElement, '本板自建：订单数按仓库');
    await userEvent.click(
      entries(canvasElement).getByRole('button', { name: '另存为视图…' }),
    );
    const dialog = await page().findByRole('dialog', { name: '另存为视图' });
    const inside = within(dialog);
    await expect(dialog).toHaveTextContent('它会成为「订单」的一个视图');
    await expect(inside.getByRole('radio', { name: '所有人' })).toBeChecked();
    const title = inside.getByRole('textbox', { name: '标题' });
    await expect(title).toHaveValue('本板自建：订单数按仓库');
    await userEvent.click(inside.getByRole('button', { name: '保存视图' }));

    await waitFor(() => expect(page().queryByRole('dialog')).toBeNull());
    // No longer the board's own: nothing left to save as a view.
    await waitFor(() =>
      expect(
        entries(canvasElement).getByRole('button', { name: '另存为视图…' }),
      ).toBeDisabled(),
    );
    await expect(
      canvasElement.querySelector('[data-slot="building-announcement"]'),
    ).toHaveTextContent('已另存为视图「本板自建：订单数按仓库」');
  },
};

/**
 * Screen D: a panel's own look. The visualization panel picks a pie for
 * this panel alone; the panel says 「此处改为饼图」, is drawn as a pie from
 * the rows it had — no query — and 「恢复为视图的样子」 puts the view's own
 * bars back.
 */
export const OverrideToPieAndReset: Story = {
  ...DisplayOverview,
  decorators: [DESK],
  play: async ({ canvasElement }) => {
    await startBuilding(canvasElement);
    await chartsDrawn(canvasElement);
    await choosePanel(canvasElement, '按仓库汇总');
    const asked = aggregateCalls.current;
    await userEvent.click(
      entries(canvasElement).getByRole('button', { name: '改这里的展示…' }),
    );
    const look = () =>
      page().findByRole('dialog', { name: '「按仓库汇总」在这里的展示' });
    let dialog = await look();
    await userEvent.click(within(dialog).getByRole('radio', { name: '饼图' }));
    // Beside the options, the panel as it will look: a pie.
    await expect(
      await within(dialog).findByRole('img', { name: /^饼图/ }),
    ).toBeVisible();
    await expect(within(canvasElement).getByText('此处改为饼图')).toBeTruthy();
    await userEvent.click(within(dialog).getByRole('button', { name: '完成' }));
    await waitFor(() => expect(page().queryByRole('dialog')).toBeNull());

    // On the board: marked, and drawn as a pie from the rows it had.
    await expect(within(canvasElement).getByText('此处改为饼图')).toBeVisible();
    await expect(
      await within(canvasElement).findByRole('img', { name: /^饼图/ }),
    ).toBeVisible();
    // Presentation never asks the source (D20).
    await expect(aggregateCalls.current).toBe(asked);

    // Put back: the view's own bars, and no mark.
    await userEvent.click(
      entries(canvasElement).getByRole('button', { name: '恢复为视图的样子' }),
    );
    await waitFor(() =>
      expect(within(canvasElement).queryByText('此处改为饼图')).toBeNull(),
    );
    await expect(
      await within(canvasElement).findByRole('img', { name: /^柱状图/ }),
    ).toBeVisible();

    // Cancel in the dialog puts back what the panel had when it opened.
    await userEvent.click(
      entries(canvasElement).getByRole('button', { name: '改这里的展示…' }),
    );
    dialog = await look();
    await userEvent.click(within(dialog).getByRole('radio', { name: '饼图' }));
    await userEvent.click(within(dialog).getByRole('button', { name: '取消' }));
    await waitFor(() => expect(page().queryByRole('dialog')).toBeNull());
    await expect(within(canvasElement).queryByText('此处改为饼图')).toBeNull();
    await expect(aggregateCalls.current).toBe(asked);
  },
};

/**
 * Screen E: tabs. Only the tab on screen runs — switching to the second
 * asks for its one panel and nothing else, switching back asks nothing —
 * the workbench tells the host which tab to write into the address, and a
 * board opened again lands on the tab its reader last read.
 */
export const TabsRunOnlyTheTabShown: Story = {
  ...DisplayTabs,
  decorators: [DESK],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const tabs = await canvas.findByRole('tablist', { name: '标签页' });
    await canvas.findByRole('heading', { level: 3, name: '按仓库汇总' });
    await expect(canvas.queryByText('按状态看金额')).toBeNull();
    await waitFor(() =>
      expect(
        canvasElement.querySelector('[data-story-address]'),
      ).toHaveTextContent('tab-outbound'),
    );
    await chartsDrawn(canvasElement);
    const asked = aggregateCalls.current;

    await userEvent.click(within(tabs).getByRole('tab', { name: '状态' }));
    await canvas.findByRole('heading', { level: 3, name: '按状态看金额' });
    await waitFor(() => expect(aggregateCalls.current).toBeGreaterThan(asked));
    const second = aggregateCalls.current;
    await expect(
      canvasElement.querySelector('[data-story-address]'),
    ).toHaveTextContent('tab-status');

    await userEvent.click(within(tabs).getByRole('tab', { name: '出库' }));
    await canvas.findByRole('heading', { level: 3, name: '按仓库汇总' });
    await expect(aggregateCalls.current).toBe(second);

    // The reader's last tab is theirs: back on 状态, and opened again there.
    await userEvent.click(within(tabs).getByRole('tab', { name: '状态' }));
    await canvas.findByRole('heading', { level: 3, name: '按状态看金额' });
    await userEvent.click(
      entries(canvasElement).getByRole('button', { name: '重新打开' }),
    );
    await waitFor(() =>
      expect(canvas.getByRole('tab', { name: '状态' })).toHaveAttribute(
        'aria-selected',
        'true',
      ),
    );
    await expect(
      canvas.queryByRole('heading', { level: 3, name: '待出库明细' }),
    ).toBeNull();
  },
};

/**
 * Screen E while building: a tab added and named in place, a panel moved to
 * it, and the move seen there.
 */
export const TabsBuilt: Story = {
  ...DisplayTabs,
  decorators: [DESK],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await startBuilding(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: '添加标签页' }));
    const name = await canvas.findByRole('textbox', {
      name: '标签页「标签页 3」的名字',
    });
    // Focused with its name selected: typing replaces it.
    await waitFor(() => expect(name).toHaveFocus());
    await userEvent.keyboard('异常{Enter}');
    // Being built, the bar is the tabs to arrange; the one on screen is
    // the one pressed in.
    const added = await canvas.findByRole('button', { name: '异常' });
    await expect(added).toHaveAttribute('aria-current', 'true');
    await expect(canvas.getByText('这个标签页还没有面板')).toBeVisible();

    // Back to the first tab, and a panel moved to the new one.
    await userEvent.click(canvas.getByRole('button', { name: '出库' }));
    await choosePanel(canvasElement, '按仓库汇总');
    await userEvent.selectOptions(
      entries(canvasElement).getByRole('combobox', { name: '移到标签页' }),
      '异常',
    );
    await userEvent.click(
      entries(canvasElement).getByRole('button', { name: '移过去' }),
    );
    await waitFor(() =>
      expect(
        canvas.queryByRole('heading', { level: 3, name: '按仓库汇总' }),
      ).toBeNull(),
    );
    await userEvent.click(canvas.getByRole('button', { name: '异常' }));
    await expect(
      await canvas.findByRole('heading', { level: 3, name: '按仓库汇总' }),
    ).toBeVisible();

    // Reordered from the keyboard: the handle answers the arrows.
    const handle = canvas.getByRole('button', { name: '调整「异常」的顺序' });
    handle.focus();
    await userEvent.keyboard('{ArrowLeft}');
    await waitFor(() =>
      expect(
        within(canvas.getByRole('list', { name: '标签页' }))
          .getAllByRole('listitem')
          .map(
            item =>
              item.querySelector('[data-slot="dashboard-tab"]')?.textContent,
          ),
      ).toEqual(['出库', '异常', '状态']),
    );
  },
};
