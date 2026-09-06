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

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { createRef } from 'react';
import { CommandStage, ErrorCodes } from '@ahoo-wang/fetcher-wow';
import type {
  CommandResult,
  MaterializedSnapshot,
} from '@ahoo-wang/fetcher-wow';
import { FetcherViewer } from '../../src/fetcherviewer/FetcherViewer';
import type { FetcherViewerRef } from '../../src/fetcherviewer/FetcherViewer';
import type { ViewState } from '../../src/viewer/types';
import storyMeta from '../../../../stories/viewer/FetcherViewer.stories';
import type { ViewerFixtureScenario } from '../../../../stories/fixtures/http';

let restoreStory: (() => void) | undefined;
const commands: { path: string; result: CommandResult }[] = [];

function installStoryFixture(scenario: ViewerFixtureScenario) {
  // Execute the real Storybook lifecycle with the args it consumes.
  restoreStory = Reflect.apply(storyMeta.beforeEach, undefined, [
    {
      args: { scenario, enhance: false, showRefMethods: false },
    },
  ]);
  const fixtureFetch = globalThis.fetch;
  globalThis.fetch = async (input, init) => {
    const response = await fixtureFetch(input, init);
    const path = new URL(
      input instanceof Request ? input.url : String(input),
      'https://api.example.test',
    ).pathname;
    if (path.startsWith('/viewer/tenant/')) {
      commands.push({ path, result: await response.clone().json() });
    }
    return response;
  };
}

beforeEach(() => {
  commands.length = 0;
});
afterEach(() => {
  cleanup();
  restoreStory?.();
  restoreStory = undefined;
});

async function snapshots(): Promise<MaterializedSnapshot<ViewState>[]> {
  const response = await fetch(
    'https://api.example.test/viewer/view/snapshot/list',
    {
      method: 'POST',
      body: '{}',
    },
  );
  return response.json();
}

it.each(['PERSONAL', 'SHARED'] as const)(
  'creates a %s view through the real empty Storybook fixture',
  async type => {
    installStoryFixture('empty-views');
    const ref = createRef<FetcherViewerRef>();
    render(
      <FetcherViewer
        ref={ref}
        viewerDefinitionId="users"
        defaultViewId="all-users"
        pagination={{ showSizeChanger: false }}
      />,
    );
    fireEvent.click(await screen.findByRole('button', { name: '创建视图' }));
    fireEvent.change(screen.getByLabelText('视图名称'), {
      target: { value: 'Created in Storybook' },
    });
    if (type === 'SHARED')
      fireEvent.click(screen.getByRole('radio', { name: '共享视图' }));
    fireEvent.click(screen.getByRole('button', { name: /^确\s*认$/ }));

    await waitFor(() =>
      expect(ref.current?.getActiveView()?.name).toBe('Created in Storybook'),
    );
    await screen.findByText('Ada');
    expect(screen.queryByRole('alert')).toBeNull();
    expect(commands).toHaveLength(1);
    const [{ path, result }] = commands;
    const owner = type === 'SHARED' ? '(shared)' : '(0)';
    expect(path).toBe(`/viewer/tenant/(0)/owner/${owner}/view/type/${type}`);
    expect(result).toMatchObject({
      contextName: 'viewer',
      aggregateName: 'view',
      tenantId: '(0)',
      aggregateVersion: 1,
      errorCode: ErrorCodes.SUCCEEDED,
      stage: CommandStage.PROCESSED,
    });
    expect(result.commandId).toBeTruthy();
    expect(result.requestId).toBeTruthy();
    expect(result.function.functionKind).toBe('COMMAND');
    expect(await snapshots()).toEqual([
      expect.objectContaining({
        aggregateId: result.aggregateId,
        tenantId: '(0)',
        ownerId: owner,
        version: 1,
        state: expect.objectContaining({
          id: result.aggregateId,
          name: 'Created in Storybook',
          type,
        }),
      }),
    ]);
    const states = await fetch(
      'https://api.example.test/viewer/view/snapshot/list/state',
      { method: 'POST', body: '{}' },
    ).then(response => response.json());
    expect(states).toEqual([
      expect.objectContaining({ id: result.aggregateId }),
    ]);
  },
  15_000,
);

it('updates the Admins sort through the real Storybook fixture and resets state on a new installation', async () => {
  installStoryFixture('success');
  const ref = createRef<FetcherViewerRef>();
  render(
    <FetcherViewer
      ref={ref}
      viewerDefinitionId="users"
      defaultViewId="all-users"
      pagination={{ showSizeChanger: false }}
    />,
  );
  fireEvent.click(await screen.findByText('Admins'));
  fireEvent.click(await screen.findByRole('columnheader', { name: 'Name' }));
  const saveButton = screen.getByRole('button', { name: /保\s*存/ });
  fireEvent.click(saveButton);
  fireEvent.click(await screen.findByText('覆盖当前视图'));
  fireEvent.click(screen.getByRole('button', { name: /^确\s*认$/ }));

  await waitFor(() => {
    expect(ref.current?.getActiveView()?.sorter).toEqual([
      { field: 'name', direction: 'ASC' },
    ]);
    // Repeated role scans can block the async save under concurrent test load.
    expect(saveButton).not.toBeInTheDocument();
  });
  expect(screen.getByRole('columnheader', { name: 'Name' })).toHaveAttribute(
    'aria-sort',
    'ascending',
  );
  expect(screen.queryByRole('button', { name: /保\s*存/ })).toBeNull();
  expect(screen.queryByRole('alert')).toBeNull();
  expect(commands).toHaveLength(1);
  expect(commands[0].path).toBe(
    '/viewer/tenant/(0)/owner/(0)/view/admin-users/type/PERSONAL',
  );
  expect(commands[0].result).toMatchObject({
    aggregateId: 'admin-users',
    aggregateVersion: 2,
    errorCode: ErrorCodes.SUCCEEDED,
  });
  const saved = (await snapshots()).find(
    snapshot => snapshot.aggregateId === 'admin-users',
  );
  expect(saved?.version).toBe(2);
  expect(saved?.state.sorter).toEqual([{ field: 'name', direction: 'ASC' }]);

  cleanup();
  restoreStory?.();
  installStoryFixture('success');
  const fresh = (await snapshots()).find(
    snapshot => snapshot.aggregateId === 'admin-users',
  );
  expect(fresh?.version).toBe(1);
  expect(fresh?.state.sorter).toEqual([]);
  const Demo = storyMeta.component;
  render(<Demo scenario="success" enhance={false} showRefMethods />);
  await screen.findByText('Ada');
  fireEvent.click(screen.getByRole('button', { name: 'Read state' }));
  expect(screen.getByText(/^Definition: users/)).toHaveTextContent(
    'Definition: users · View: all-users · Page: 1',
  );
}, 15_000);
