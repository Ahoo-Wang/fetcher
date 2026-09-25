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
  CoSecConfigurer,
  DeviceIdStorage,
  sameOriginTrust,
  TokenStorage,
  type CompositeToken,
  type RequestTrust,
} from '../src';

const jwt = (sub: string, exp: number) =>
  `e30.${btoa(JSON.stringify({ sub, exp }))}.signature`;
const token: CompositeToken = {
  accessToken: jwt('user', Date.now() / 1000 + 3600),
  refreshToken: jwt('user', Date.now() / 1000 + 7200),
};

let sent: Record<string, Headers>;

function configured(isTrusted?: RequestTrust): Fetcher {
  const fetcher = new Fetcher({ baseURL: 'https://api.example.com/v1' });
  const tokenStorage = new TokenStorage({
    storage: new InMemoryStorage(),
    eventBus: new SerialTypedEventBus('trust'),
  });
  tokenStorage.signIn(token);
  new CoSecConfigurer({
    appId: 'app',
    tokenStorage,
    deviceIdStorage: new DeviceIdStorage({
      storage: new InMemoryStorage(),
      eventBus: new SerialTypedEventBus('trust-device'),
    }),
    tokenRefresher: { refresh: async () => token },
    isTrusted,
  }).applyTo(fetcher);
  return fetcher;
}

beforeEach(() => {
  sent = {};
  vi.stubGlobal('fetch', async (url: string, init: RequestInit) => {
    sent[url] = new Headers(init.headers as HeadersInit);
    return new Response('{}');
  });
});

describe('request trust', () => {
  it('sends credentials everywhere by default, as before', async () => {
    const fetcher = configured();
    await fetcher.get('https://other.example.net/page');
    const headers = sent['https://other.example.net/page'];
    expect(headers.get('authorization')).toMatch(/^Bearer /);
    expect(headers.get('cosec-device-id')).toBeTruthy();
  });

  describe('with sameOriginTrust', () => {
    it('sends credentials for relative URLs and the baseURL origin', async () => {
      const fetcher = configured(sameOriginTrust);
      await fetcher.get('/users');
      await fetcher.get('https://api.example.com/v2/users');
      for (const url of [
        'https://api.example.com/v1/users',
        'https://api.example.com/v2/users',
      ]) {
        expect(sent[url].get('authorization')).toMatch(/^Bearer /);
        expect(sent[url].get('cosec-app-id')).toBe('app');
      }
    });

    it('keeps the token and CoSec headers from another origin', async () => {
      const fetcher = configured(sameOriginTrust);
      await fetcher.get('https://evil.example.net/next-page');
      const headers = sent['https://evil.example.net/next-page'];
      expect(headers.has('authorization')).toBe(false);
      expect(headers.has('cosec-device-id')).toBe(false);
      expect(headers.has('cosec-app-id')).toBe(false);
    });
  });

  it('asks a custom predicate only about absolute URLs', async () => {
    const isTrusted = vi.fn((url: string) => url.startsWith('https://cdn.'));
    const fetcher = configured(isTrusted);
    await fetcher.get('/users');
    await fetcher.get('https://cdn.example.com/file');
    await fetcher.get('https://elsewhere.example.com/file');
    expect(isTrusted.mock.calls.map(([url]) => url)).toEqual([
      'https://cdn.example.com/file',
      'https://cdn.example.com/file',
      'https://elsewhere.example.com/file',
      'https://elsewhere.example.com/file',
    ]);
    expect(sent['https://cdn.example.com/file'].get('authorization')).toMatch(
      /^Bearer /,
    );
    expect(
      sent['https://elsewhere.example.com/file'].has('authorization'),
    ).toBe(false);
  });
});
