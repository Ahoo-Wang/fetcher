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
import { EditableFilterPanel, TypedFilter } from '@ahoo-wang/fetcher-viewer';
import type {
  ActiveFilter,
  FilterRef,
  FilterValue,
} from '@ahoo-wang/fetcher-viewer';
import { Operator } from '@ahoo-wang/fetcher-wow';
import { useRef, useState } from 'react';
import { expect, userEvent, within } from 'storybook/test';
import { fixtureAvailableFilters } from '../fixtures/viewer';

const initialNameFilter: ActiveFilter = {
  key: 'name',
  type: 'text',
  field: { name: 'name', label: 'Name' },
  value: { placeholder: 'Filter name' },
};

function EditTextFilterDemo() {
  const [value, setValue] = useState<FilterValue>();
  return (
    <section className="story-stack" aria-label="Text filter">
      <TypedFilter
        type="text"
        field={{ name: 'name', label: 'Name' }}
        value={{ placeholder: 'Filter name' }}
        onChange={setValue}
      />
      <output className="story-output" aria-live="polite">
        {JSON.stringify(value?.condition ?? null)}
      </output>
    </section>
  );
}

function FilterGallery() {
  const textRef = useRef<FilterRef>(null);
  const numberRef = useRef<FilterRef>(null);
  const selectRef = useRef<FilterRef>(null);
  const boolRef = useRef<FilterRef>(null);
  const dateRef = useRef<FilterRef>(null);
  const [output, setOutput] = useState('Read the current conditions');

  const read = () => {
    const conditions = [textRef, numberRef, selectRef, boolRef, dateRef]
      .map(ref => ref.current?.getValue()?.condition)
      .filter(condition => condition !== undefined);
    setOutput(JSON.stringify(conditions));
  };

  return (
    <section className="story-stack" aria-label="Typed filters">
      <TypedFilter
        ref={textRef}
        type="text"
        field={{ name: 'name', label: 'Text' }}
        value={{ defaultValue: 'Ada' }}
      />
      <TypedFilter
        ref={numberRef}
        type="number"
        field={{ name: 'balance', label: 'Number' }}
        value={{ defaultValue: 10 }}
      />
      <TypedFilter
        ref={selectRef}
        type="select"
        field={{ name: 'role', label: 'Select' }}
        value={{
          defaultValue: ['Admin'],
          options: [{ label: 'Admin', value: 'Admin' }],
        }}
      />
      <TypedFilter
        ref={boolRef}
        type="bool"
        field={{ name: 'active', label: 'Boolean' }}
        operator={{ defaultValue: Operator.TRUE }}
      />
      <TypedFilter
        ref={dateRef}
        type="datetime"
        field={{ name: 'createdAt', label: 'Date/time' }}
        operator={{ defaultValue: Operator.GTE }}
        value={{ defaultValue: Date.parse('2026-01-15T09:30:00.000Z') }}
      />
      <button onClick={read}>Read filters</button>
      <output className="story-output" aria-live="polite">
        {output}
      </output>
    </section>
  );
}

function EditableWorkflow() {
  const [filters, setFilters] = useState<ActiveFilter[]>([initialNameFilter]);
  const [output, setOutput] = useState('Active filters: Name');

  return (
    <section className="story-stack" aria-label="Editable filters">
      <EditableFilterPanel
        filters={filters}
        availableFilters={fixtureAvailableFilters}
        onChange={nextFilters => {
          setFilters(nextFilters);
          setOutput(
            `Active filters: ${nextFilters.map(filter => filter.field.label).join(', ') || 'none'}`,
          );
        }}
        onSearch={condition => setOutput(JSON.stringify(condition))}
        resetButton
      />
      <output className="story-output" aria-live="polite">
        {output}
      </output>
    </section>
  );
}

const meta = {
  title: 'Viewer/Filters',
  parameters: { layout: 'padded' },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const EditTextFilter: Story = {
  render: () => <EditTextFilterDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByPlaceholderText('Filter name'), 'Ada');
    await expect(
      await canvas.findByText('{"field":"name","operator":"EQ","value":"Ada"}'),
    ).toBeVisible();
  },
};

export const TypedGallery: Story = {
  render: () => <FilterGallery />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Read filters' }));
    await expect(await canvas.findByText(/"field":"name"/)).toBeVisible();
  },
};

export const AddAvailableFilter: Story = {
  render: () => <EditableWorkflow />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const page = within(canvasElement.ownerDocument.body);
    await userEvent.click(canvas.getByRole('button', { name: /添加过滤器/ }));
    await userEvent.click(await page.findByRole('checkbox', { name: 'Role' }));
    await userEvent.click(page.getByRole('button', { name: 'OK' }));
    await expect(
      await canvas.findByText('Active filters: Name, Role'),
    ).toBeVisible();
  },
};

export const RemoveFilter: Story = {
  render: () => <EditableWorkflow />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.hover(canvas.getByText('Name'));
    const remove = canvas
      .getAllByRole('button')
      .find(button => button.classList.contains('ant-btn-circle'));
    if (!remove) throw new Error('Remove filter button was not shown');
    await userEvent.click(remove);
    await expect(await canvas.findByText('Active filters: none')).toBeVisible();
  },
};

export const ResetValues: Story = {
  render: () => <EditableWorkflow />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByPlaceholderText('Filter name'), 'Ada');
    await userEvent.click(canvas.getByRole('button', { name: /搜索|Search/ }));
    await expect(await canvas.findByText(/"value":"Ada"/)).toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: /Reset/ }));
    await userEvent.click(canvas.getByRole('button', { name: /搜索|Search/ }));
    await expect(await canvas.findByText('{"operator":"ALL"}')).toBeVisible();
  },
};

export const UnsupportedType: Story = {
  render: () => (
    <TypedFilter type="custom-missing" field={{ name: 'x', label: 'Custom' }} />
  ),
};
