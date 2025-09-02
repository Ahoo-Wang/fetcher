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

import { describe, it, expect } from 'vitest';
import { isAbsoluteURL, combineURLs } from '../src';

describe('urls.ts', () => {
  describe('isAbsoluteURL', () => {
    it('should return true for absolute URLs', () => {
      expect(isAbsoluteURL('http://example.com')).toBe(true);
      expect(isAbsoluteURL('https://example.com')).toBe(true);
      expect(isAbsoluteURL('ftp://example.com')).toBe(true);
      expect(isAbsoluteURL('//example.com')).toBe(true);
    });

    it('should return false for relative URLs', () => {
      expect(isAbsoluteURL('/path')).toBe(false);
      expect(isAbsoluteURL('path')).toBe(false);
      expect(isAbsoluteURL('./path')).toBe(false);
      expect(isAbsoluteURL('../path')).toBe(false);
    });
  });

  describe('combineURLs', () => {
    it('should return relativeURL if it is an absolute URL', () => {
      expect(combineURLs('http://base.com', 'http://other.com')).toBe(
        'http://other.com',
      );
      expect(combineURLs('http://base.com', '//other.com')).toBe('//other.com');
    });

    it('should combine baseURL and relativeURL correctly', () => {
      expect(combineURLs('http://base.com', 'path')).toBe(
        'http://base.com/path',
      );
      expect(combineURLs('http://base.com/', 'path')).toBe(
        'http://base.com/path',
      );
      expect(combineURLs('http://base.com', '/path')).toBe(
        'http://base.com/path',
      );
      expect(combineURLs('http://base.com/', '/path')).toBe(
        'http://base.com/path',
      );
    });

    it('should return baseURL if relativeURL is empty', () => {
      expect(combineURLs('http://base.com', '')).toBe('http://base.com');
      expect(combineURLs('http://base.com', undefined as any)).toBe(
        'http://base.com',
      );
    });
  });
});
