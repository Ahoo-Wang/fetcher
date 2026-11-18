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

import { act, render, renderHook } from '@testing-library/react';
import { Fetcher, ResultExtractors } from '@ahoo-wang/fetcher';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { InMemoryStorage, KeyStorage } from '@ahoo-wang/fetcher-storage';
import { useFetcher, useKeyStorage } from '../src';

describe('useKeyStorage hydration', () => {
  it('hydrates from the default the server rendered, then shows the stored value', async () => {
    const storage = new InMemoryStorage();
    const keyStorage = new KeyStorage<string>({ key: 'theme', storage });
    function Theme() {
      const [theme] = useKeyStorage(keyStorage, 'light');
      return <span>{theme}</span>;
    }

    // The server has no stored value to read.
    const html = renderToString(<Theme />);
    expect(html).toContain('light');

    keyStorage.set('dark');
    const container = document.createElement('div');
    container.innerHTML = html;
    const onRecoverableError = vi.fn();
    await act(async () => {
      hydrateRoot(container, <Theme />, { onRecoverableError });
    });

    expect(onRecoverableError).not.toHaveBeenCalled();
    expect(container.textContent).toBe('dark');
    keyStorage.destroy();
  });
});

describe('useFetcher exchange on failure', () => {
  it('exposes the failed request exchange, not the previous one', async () => {
    const fetcher = new Fetcher({ baseURL: 'https://purity.test' });
    let fail = false;
    vi.stubGlobal('fetch', async () => {
      if (fail) throw new TypeError('network down');
      return new Response('ok');
    });
    const { result } = renderHook(() =>
      useFetcher<string>({ fetcher, resultExtractor: ResultExtractors.Text }),
    );

    await act(async () => {
      await result.current.execute({ url: '/a' });
    });
    expect(result.current.exchange).toBeDefined();

    fail = true;
    await act(async () => {
      await result.current.execute({ url: '/b' });
    });
    expect(result.current.status).toBe('error');
    expect(result.current.exchange?.request.url).toContain('/b');
    vi.unstubAllGlobals();
  });
});
