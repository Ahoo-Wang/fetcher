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

import { Fetcher } from '@ahoo-wang/fetcher';
import { SerialTypedEventBus } from '@ahoo-wang/fetcher-eventbus';
import { InMemoryStorage } from '@ahoo-wang/fetcher-storage';
import {
  AuthorizationRequestInterceptor,
  AuthorizationResponseInterceptor,
  CoSecTokenRefresher,
  JwtTokenManager,
  TokenStorage,
  type CompositeToken,
} from '../src';

const jwt = (sub: string, exp: number) =>
  `e30.${btoa(JSON.stringify({ sub, exp }))}.signature`;
const token = (sub: string): CompositeToken => ({
  accessToken: jwt(sub, Date.now() / 1000 + 3600),
  refreshToken: jwt(sub, Date.now() / 1000 + 7200),
});

describe('authentication lifecycle', () => {
  let storage: TokenStorage;

  beforeEach(() => {
    storage = new TokenStorage({
      storage: new InMemoryStorage(),
      eventBus: new SerialTypedEventBus('auth-lifecycle'),
    });
    storage.signIn(token('original'));
  });

  afterEach(() => {
    storage.destroy();
    storage.eventBus.destroy();
  });

  it.each(['success', 'failure'] as const)(
    'keeps a signed-out session signed out after refresh %s',
    async outcome => {
      let resolve!: (value: CompositeToken) => void;
      let reject!: (error: Error) => void;
      const manager = new JwtTokenManager(storage, {
        refresh: () =>
          new Promise((yes, no) => {
            resolve = yes;
            reject = no;
          }),
      });
      const refresh = manager.refresh();
      const settled = refresh.catch(() => undefined);
      storage.signOut();
      if (outcome === 'success') resolve(token('refreshed'));
      else reject(new Error('refresh rejected'));
      await settled;
      expect(storage.get()).toBeNull();
    },
  );

  it.each(['success', 'failure'] as const)(
    'preserves a replacement session after old refresh %s',
    async outcome => {
      let resolve!: (value: CompositeToken) => void;
      let reject!: (error: Error) => void;
      const manager = new JwtTokenManager(storage, {
        refresh: () =>
          new Promise((yes, no) => {
            resolve = yes;
            reject = no;
          }),
      });
      const settled = manager.refresh().catch(() => undefined);
      const replacement = token('replacement');
      storage.signOut();
      storage.signIn(replacement);
      if (outcome === 'success') resolve(token('refreshed'));
      else reject(new Error('refresh rejected'));
      await settled;
      expect(storage.get()?.token).toEqual(replacement);
    },
  );

  it('rejects a 401 refresh response instead of awaiting its own refresh', async () => {
    const client = new Fetcher({ baseURL: 'https://example.test' });
    const manager = new JwtTokenManager(
      storage,
      new CoSecTokenRefresher({
        fetcher: client,
        endpoint: '/refresh',
      }),
    );
    client.interceptors.request.use(
      new AuthorizationRequestInterceptor({ tokenManager: manager }),
    );
    client.interceptors.response.use(
      new AuthorizationResponseInterceptor({ tokenManager: manager }),
    );
    const requested: string[] = [];
    vi.stubGlobal('fetch', async (url: string) => {
      requested.push(url);
      return new Response('', { status: 401 });
    });
    const result = client.get('/resource').then(
      () => 'resolved',
      () => 'rejected',
    );
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      const outcome = await Promise.race([
        result,
        new Promise(resolve => {
          timer = setTimeout(() => resolve('pending'), 100);
        }),
      ]);
      expect(outcome).toBe('rejected');
      expect(requested).toEqual([
        'https://example.test/resource',
        'https://example.test/refresh',
      ]);
      expect(storage.get()).toBeNull();
    } finally {
      clearTimeout(timer);
    }
  });

  it('preserves an explicitly supplied lowercase authorization header', async () => {
    const client = new Fetcher({ baseURL: 'https://example.test' });
    const manager = new JwtTokenManager(storage, { refresh: async old => old });
    client.interceptors.request.use(
      new AuthorizationRequestInterceptor({ tokenManager: manager }),
    );
    let authorization: string | null = null;
    vi.stubGlobal('fetch', async (_url: string, init: RequestInit) => {
      authorization = new Headers(init.headers).get('authorization');
      return new Response('{}');
    });
    await client.get('/resource', {
      headers: { authorization: 'Bearer explicit' },
    });
    expect(authorization).toBe('Bearer explicit');
  });

  it('does not clear a replacement session when its 401 joins an old refresh', async () => {
    let reject!: (error: Error) => void;
    const manager = new JwtTokenManager(storage, {
      refresh: () =>
        new Promise((_, no) => {
          reject = no;
        }),
    });
    const first = manager.refresh().catch(() => undefined);
    storage.signOut();
    const replacement = token('replacement');
    storage.signIn(replacement);
    const exchange = new Fetcher().resolveExchange({ url: '/resource' });
    exchange.response = new Response('', { status: 401 });
    const second = new AuthorizationResponseInterceptor({
      tokenManager: manager,
    })
      .intercept(exchange)
      .catch(() => undefined);
    reject(new Error('old refresh failed'));
    await Promise.all([first, second]);
    expect(storage.get()?.token).toEqual(replacement);
  });
});
