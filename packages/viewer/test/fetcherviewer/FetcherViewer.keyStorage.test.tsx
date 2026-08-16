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

import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { FetcherViewer } from '../../src/fetcherviewer/FetcherViewer';
import type { PaginationProps } from 'antd';

const keyStorageConstructorSpy = vi.hoisted(() => vi.fn());

vi.mock('@ahoo-wang/fetcher-storage', () => ({
  KeyStorage: class {
    constructor(options: unknown) {
      keyStorageConstructorSpy(options);
    }
  },
}));

vi.mock('../../src/fetcherviewer/hooks/useViewerDefinition', () => ({
  useViewerDefinition: vi.fn(),
}));

vi.mock('../../src/fetcherviewer/hooks/useViewerViews', () => ({
  useViewerViews: vi.fn(),
}));

vi.mock('../../src/fetcherviewer/hooks/useFetchData', () => ({
  useFetchData: vi.fn(),
}));

vi.mock('../../src/hooks/useRefreshDataEventBus', () => ({
  useRefreshDataEventBus: vi.fn(() => ({
    publish: vi.fn(),
    subscribe: vi.fn(),
  })),
}));

vi.mock('@ahoo-wang/fetcher-react', () => ({
  useKeyStorage: vi.fn(() => [undefined, vi.fn()]),
}));

vi.mock('../../src/viewer/Viewer', () => ({
  Viewer: vi.fn(() => <div data-testid="viewer">Viewer</div>),
}));

import { useViewerDefinition, useViewerViews, useFetchData } from '../../src';

describe('FetcherViewer local default view KeyStorage', () => {
  const defaultProps = {
    viewerDefinitionId: 'test-view',
    ownerId: 'test-owner',
    tenantId: 'test-tenant',
    pagination: {} as PaginationProps,
    enableRowSelection: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(useViewerDefinition).mockReturnValue({
      viewerDefinition: {
        id: 'test-view',
        name: 'Test View',
        fields: [{ name: 'id', label: 'ID', type: 'number', primaryKey: true }],
        availableFilters: [],
        dataUrl: '/api/test',
        countUrl: '/api/test/count',
      } as any,
      loading: false,
      error: undefined,
    });

    vi.mocked(useViewerViews).mockReturnValue({
      views: [] as any,
      loading: false,
      error: undefined,
    });

    vi.mocked(useFetchData).mockReturnValue({
      dataSource: { list: [], total: 0 } as any,
      loading: false,
      setQuery: vi.fn(),
      reload: vi.fn().mockResolvedValue(undefined),
      error: undefined,
      getPageQuery: vi.fn(),
    });
  });

  // The KeyStorage for the local default view id must have a render-invariant
  // identity: useKeyStorage requires a stable reference, otherwise each new
  // instance makes useSyncExternalStore tear down and re-subscribe, and every
  // callback depending on it (e.g. onSwitchView) gets a fresh identity.
  // NOTE: react-compiler currently masks the original `new KeyStorage(...)`
  // in the component body by auto-memoizing it, so this test passes both
  // before and after the source-level fix (hoisting to module scope). It is
  // kept as a characterization test: if the compiler ever bails out on this
  // component or the construction is moved back into the render path, this
  // test turns red.
  it('should not re-create the KeyStorage on re-renders', () => {
    const { rerender } = render(<FetcherViewer {...defaultProps} />);
    const callsAfterFirstRender = keyStorageConstructorSpy.mock.calls.length;

    rerender(<FetcherViewer {...defaultProps} />);
    rerender(<FetcherViewer {...defaultProps} />);

    expect(keyStorageConstructorSpy.mock.calls.length).toBe(
      callsAfterFirstRender,
    );
  });
});
