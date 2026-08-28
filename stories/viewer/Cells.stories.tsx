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
import {
  ActionCell,
  ActionsCell,
  AvatarCell,
  CalendarTimeCell,
  CurrencyCell,
  DateTimeCell,
  ImageCell,
  ImageGroupCell,
  LinkCell,
  PrimaryKeyCell,
  TagCell,
  TagsCell,
  TextCell,
  typedCellRender,
} from '@ahoo-wang/fetcher-viewer';
import { useState } from 'react';
import { expect, userEvent, within } from 'storybook/test';
import { fixtureAvatar, fixtureViewerUsers } from '../fixtures/viewer';

function CellGallery() {
  const record = fixtureViewerUsers[0];
  const [output, setOutput] = useState('Choose an action');
  const data = (value: unknown) => ({ value, record, index: 0 });
  const missingRenderer = typedCellRender('missing-cell');
  const calendarFormats = {
    sameDay: 'YYYY-MM-DD HH:mm',
    nextDay: 'YYYY-MM-DD HH:mm',
    nextWeek: 'YYYY-MM-DD HH:mm',
    lastDay: 'YYYY-MM-DD HH:mm',
    lastWeek: 'YYYY-MM-DD HH:mm',
    sameElse: 'YYYY-MM-DD HH:mm',
  };

  return (
    <section className="story-stack" aria-label="Cell gallery">
      <table>
        <thead>
          <tr>
            <th scope="col">Cell</th>
            <th scope="col">Rendered value</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th scope="row">Text / long text</th>
            <td>
              <TextCell
                data={data(
                  'A deliberately long value that demonstrates ellipsis behavior.',
                )}
                attributes={{ ellipsis: true, style: { maxWidth: 240 } }}
              />
            </td>
          </tr>
          <tr>
            <th scope="row">Primary key</th>
            <td>
              <PrimaryKeyCell
                data={data(record.id)}
                attributes={{
                  onClick: user => setOutput(`Opened ${user.name}`),
                }}
              />
            </td>
          </tr>
          <tr>
            <th scope="row">Link</th>
            <td>
              <LinkCell
                data={data('docs@example.test')}
                attributes={{ target: '_self' }}
              />
            </td>
          </tr>
          <tr>
            <th scope="row">Avatar / image / group</th>
            <td>
              <AvatarCell
                data={data(fixtureAvatar)}
                attributes={{ alt: 'Ada avatar', size: 32 }}
              />{' '}
              <ImageCell
                data={data(fixtureAvatar)}
                attributes={{ alt: 'Ada profile', width: 32, preview: false }}
              />{' '}
              <ImageGroupCell
                data={data([fixtureAvatar, fixtureAvatar])}
                attributes={{ alt: 'Ada gallery' }}
              />
            </td>
          </tr>
          <tr>
            <th scope="row">Invalid image</th>
            <td>
              <ImageCell
                data={data('data:image/svg+xml,invalid')}
                attributes={{
                  alt: 'Invalid local image',
                  width: 32,
                  preview: false,
                }}
              />
            </td>
          </tr>
          <tr>
            <th scope="row">Tags</th>
            <td>
              <TagCell
                data={data(record.role)}
                attributes={{ color: 'blue' }}
              />{' '}
              <TagsCell
                data={data(['typed', 'local'])}
                attributes={{ typed: { color: 'green' } }}
              />
            </td>
          </tr>
          <tr>
            <th scope="row">Zero currency</th>
            <td>
              <CurrencyCell
                data={data(0)}
                attributes={{
                  format: { currency: 'USD', locale: 'en-US', decimals: 2 },
                }}
              />
            </td>
          </tr>
          <tr>
            <th scope="row">Date / calendar</th>
            <td>
              <DateTimeCell
                data={data(record.createdAt)}
                attributes={{ format: 'YYYY-MM-DD HH:mm' }}
              />{' '}
              <CalendarTimeCell
                data={data(record.createdAt)}
                attributes={{ formats: calendarFormats }}
              />
            </td>
          </tr>
          <tr>
            <th scope="row">Actions</th>
            <td>
              <ActionCell
                data={data('Edit')}
                attributes={{
                  onClick: user => setOutput(`Action: Edit ${user.name}`),
                }}
              />{' '}
              <ActionsCell
                data={data({
                  primaryAction: {
                    data: data('Open'),
                    attributes: {
                      onClick: user => setOutput(`Action: Open ${user.name}`),
                    },
                  },
                  moreActionTitle: 'More',
                  secondaryActions: [
                    {
                      data: data('Archive'),
                      attributes: {
                        onClick: user =>
                          setOutput(`Action: Archive ${user.name}`),
                      },
                    },
                  ],
                })}
              />
            </td>
          </tr>
          <tr>
            <th scope="row">Missing renderer</th>
            <td>
              {missingRenderer?.('value', record, 0) ?? 'Fallback: raw value'}
            </td>
          </tr>
        </tbody>
      </table>
      <output className="story-output" aria-live="polite">
        {output}
      </output>
    </section>
  );
}

const meta = {
  title: 'Viewer/Tables/Cells',
  parameters: { layout: 'padded' },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Gallery: Story = {
  render: () => <CellGallery />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Edit' }));
    await expect(await canvas.findByText('Action: Edit Ada')).toBeVisible();
    await expect(
      canvas.getByRole('link', { name: 'docs@example.test' }),
    ).toHaveAttribute('href', 'mailto:docs@example.test');
  },
};
