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

import { describe, expect, it, vi } from 'vitest';
import { getFetcher } from '../src';
import { Fetcher, fetcherRegistrar } from '@ahoo-wang/fetcher';

describe('FetcherCapable', () => {
  describe('getFetcher', () => {
    it('should return undefined when no fetcher is provided', () => {
      const result = getFetcher();
      expect(result).toBeUndefined();
    });

    it('should return undefined when fetcher is null', () => {
      const result = getFetcher(null as any);
      expect(result).toBeUndefined();
    });

    it('should return the fetcher directly when it is already a Fetcher instance', () => {
      const mockFetcher = new Fetcher({} as any);
      const result = getFetcher(mockFetcher);
      expect(result).toBe(mockFetcher);
    });

    it('should resolve and return a fetcher when provided with a string identifier', () => {
      const mockFetcher = new Fetcher({} as any);
      const fetcherName = 'test-fetcher';

      // Mock the fetcher registrar
      const requiredGetSpy = vi
        .spyOn(fetcherRegistrar, 'requiredGet')
        .mockReturnValue(mockFetcher);

      const result = getFetcher(fetcherName);
      expect(result).toBe(mockFetcher);
      expect(requiredGetSpy).toHaveBeenCalledWith(fetcherName);
    });

    it('should return undefined when fetcher is an empty string', () => {
      const result = getFetcher('');
      expect(result).toBeUndefined();
    });
  });
});
