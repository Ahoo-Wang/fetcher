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

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DEFAULT_FETCHER_NAME, Fetcher } from '../src';
import { fetcherRegistrar } from '../src';
import { getFetcher, type FetcherCapable } from '../src';
import { NamedFetcher } from '../src';

describe('fetcherCapable', () => {
  let mockFetcher: Fetcher;
  let testFetcher: NamedFetcher;
  let defaultFetcher: Fetcher;
  beforeEach(() => {
    mockFetcher = new Fetcher({ baseURL: 'https://api.example.com' });
    testFetcher = new NamedFetcher('test-fetcher', {
      baseURL: 'https://test.api.com',
    });
    defaultFetcher = new NamedFetcher(DEFAULT_FETCHER_NAME);
  });

  afterEach(() => {
    // Clean up registered fetchers
    for (const [name] of fetcherRegistrar.fetchers) {
      fetcherRegistrar.unregister(name);
    }
  });

  describe('FetcherCapable', () => {
    it('should define interface with optional fetcher property', () => {
      const obj: FetcherCapable = {};
      expect(obj).not.toHaveProperty('fetcher');

      const objWithFetcher: FetcherCapable = { fetcher: mockFetcher };
      expect(objWithFetcher.fetcher).toBe(mockFetcher);
    });
  });

  describe('getFetcher', () => {
    it('should return default fetcher when no fetcher provided', () => {
      const result = getFetcher();
      expect(result).toBeInstanceOf(NamedFetcher);
      expect(result).toBe(defaultFetcher);
    });

    it('should return default fetcher when fetcher is undefined', () => {
      const result = getFetcher(undefined);
      expect(result).toBeInstanceOf(NamedFetcher);
      expect(result).toBe(defaultFetcher);
    });

    it('should return provided Fetcher instance directly', () => {
      const result = getFetcher(mockFetcher);
      expect(result).toBe(mockFetcher);
    });

    it('should return provided Fetcher instance when it is already a Fetcher', () => {
      const result = getFetcher(testFetcher);
      expect(result).toBe(testFetcher);
    });

    it('should resolve fetcher by name from registrar', () => {
      fetcherRegistrar.register('test-fetcher', testFetcher);
      const result = getFetcher('test-fetcher');
      expect(result).toBe(testFetcher);
    });

    it('should throw error when fetcher name is not found in registrar', () => {
      expect(() => {
        getFetcher('non-existent-fetcher');
      }).toThrow();
    });

    it('should return custom default fetcher when provided', () => {
      const customDefault = new Fetcher({
        baseURL: 'https://custom.default.com',
      });
      const result = getFetcher(undefined, customDefault);
      expect(result).toBe(customDefault);
    });
  });
});
