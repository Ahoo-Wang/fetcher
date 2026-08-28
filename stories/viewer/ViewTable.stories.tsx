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

import type { Meta, StoryObj } from '@storybook/react-vite';
import type {
  ViewTableActionColumn,
  ViewColumn,
} from '@ahoo-wang/fetcher-viewer';
import { ViewTable } from '@ahoo-wang/fetcher-viewer';
import type { SizeType } from 'antd/es/config-provider/SizeContext';
import type { SorterResult } from 'antd/es/table/interface';
import { useState } from 'react';
import { expect, userEvent, within } from 'storybook/test';
import type { FixtureViewerUser } from '../fixtures/viewer';
import {
  fixtureColumns,
  fixtureFields,
  fixtureViewerError,
  fixtureViewerUsers,
} from '../fixtures/viewer';

type Scenario =
  | 'default'
  | 'loading'
  | 'empty'
  | 'error'
  | 'selection'
  | 'sorting'
  | 'actions'
  | 'settings'
  | 'small';

function ViewTableDemo({ scenario }: { scenario: Scenario }) {
  const [output, setOutput] = useState('Ready');
  const [columns, setColumns] = useState<ViewColumn[]>(fixtureColumns);

  if (scenario === 'error') {
    return <div role="alert">{fixtureViewerError.message}</div>;
  }

  const actionColumn: ViewTableActionColumn<FixtureViewerUser> | undefined =
    scenario === 'actions' || scenario === 'settings'
      ? {
          title: 'Actions',
          actions: record => ({
            primaryAction: {
              data: { value: 'Edit', record, index: 0 },
              attributes: {
                onClick: user => setOutput(`Edited ${user.name}`),
              },
            },
            secondaryActions: [],
          }),
        }
      : undefined;

  const handleSort = (sorters: SorterResult<FixtureViewerUser>[]) => {
    const sorter = sorters[0];
    setOutput(`Sort: ${String(sorter.field)} ${sorter.order}`);
  };

  const tableSize: SizeType = scenario === 'small' ? 'small' : 'middle';

  return (
    <section className="story-stack" aria-label="View table">
      <ViewTable<FixtureViewerUser>
        fields={fixtureFields}
        columns={columns}
        dataSource={scenario === 'empty' ? [] : fixtureViewerUsers}
        enableRowSelection={scenario === 'selection'}
        loading={scenario === 'loading'}
        tableSize={tableSize}
        actionColumn={actionColumn}
        viewTableSetting={
          scenario === 'settings' ? { title: 'Visible columns' } : false
        }
        onColumnsChange={nextColumns => {
          setColumns(nextColumns);
          setOutput(
            `Columns: ${nextColumns.filter(column => !column.hidden).length}`,
          );
        }}
        onSortChanged={handleSort}
        onSelectChange={users =>
          setOutput(`Selected: ${users.map(user => user.name).join(', ')}`)
        }
        attributes={{ pagination: false }}
      />
      <output className="story-output" aria-live="polite">
        {output}
      </output>
    </section>
  );
}

const meta = {
  title: 'Viewer/Tables/ViewTable',
  component: ViewTableDemo,
  args: { scenario: 'default' },
  argTypes: { scenario: { control: 'radio' } },
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof ViewTableDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { args: { scenario: 'default' } };
export const Loading: Story = { args: { scenario: 'loading' } };
export const Empty: Story = {
  args: { scenario: 'empty' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByText('No data', { selector: 'div' }),
    ).toBeVisible();
  },
};
export const ErrorPresentation: Story = {
  args: { scenario: 'error' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const alert = await canvas.findByRole('alert');
    await expect(alert).toHaveTextContent(fixtureViewerError.message);
  },
};
export const RowSelection: Story = {
  args: { scenario: 'selection' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getAllByRole('checkbox')[1]);
    await expect(await canvas.findByText('Selected: Ada')).toBeVisible();
  },
};
export const Sorting: Story = {
  args: { scenario: 'sorting' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('columnheader', { name: /Name/ }));
    await expect(await canvas.findByText('Sort: name ascend')).toBeVisible();
  },
};
export const ActionColumn: Story = {
  args: { scenario: 'actions' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getAllByRole('button', { name: 'Edit' })[0]);
    await expect(await canvas.findByText('Edited Ada')).toBeVisible();
  },
};
export const ColumnSettings: Story = {
  args: { scenario: 'settings' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('img', { name: 'setting' }));
    const page = within(canvasElement.ownerDocument.body);
    await userEvent.click(await page.findByRole('checkbox', { name: 'Name' }));
    await expect(await canvas.findByText('Columns: 6')).toBeVisible();
  },
};
export const DenseRows: Story = { args: { scenario: 'small' } };
