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
import { isValidImageSrc, parseDayjs, isNullOrUndefined } from '../../../src';

describe('Table Cell Utils', () => {
  describe('isValidImageSrc', () => {
    describe('Valid image sources', () => {
      it('should return true for HTTP URLs', () => {
        expect(isValidImageSrc('http://example.com/image.jpg')).toBe(true);
        expect(isValidImageSrc('http://example.com/image.png')).toBe(true);
        expect(isValidImageSrc('http://example.com/image.gif')).toBe(true);
      });

      it('should return true for HTTPS URLs', () => {
        expect(isValidImageSrc('https://example.com/image.jpg')).toBe(true);
        expect(isValidImageSrc('https://example.com/image.png')).toBe(true);
        expect(isValidImageSrc('https://example.com/image.gif')).toBe(true);
      });

      it('should return true for relative URLs starting with /', () => {
        expect(isValidImageSrc('/images/avatar.jpg')).toBe(true);
        expect(isValidImageSrc('/assets/image.png')).toBe(true);
        expect(isValidImageSrc('/static/image.gif')).toBe(true);
      });

      it('should return true for data URLs', () => {
        expect(
          isValidImageSrc(
            'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
          ),
        ).toBe(true);
        expect(
          isValidImageSrc(
            'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R+IRjWjBqO6O2mhP//Z',
          ),
        ).toBe(true);
      });

      it('should handle URLs with query parameters', () => {
        expect(
          isValidImageSrc('https://example.com/image.jpg?width=100&height=100'),
        ).toBe(true);
        expect(isValidImageSrc('/images/avatar.png?v=123')).toBe(true);
      });

      it('should handle URLs with special characters', () => {
        expect(
          isValidImageSrc('https://example.com/image%20with%20spaces.jpg'),
        ).toBe(true);
        expect(isValidImageSrc('/images/file-name_with_underscores.png')).toBe(
          true,
        );
      });
    });

    describe('Invalid image sources', () => {
      it('should return false for non-string values', () => {
        expect(isValidImageSrc(null)).toBe(false);
        expect(isValidImageSrc(undefined)).toBe(false);
        expect(isValidImageSrc(123)).toBe(false);
        expect(isValidImageSrc({})).toBe(false);
        expect(isValidImageSrc([])).toBe(false);
        expect(isValidImageSrc(true)).toBe(false);
      });

      it('should return false for empty strings', () => {
        expect(isValidImageSrc('')).toBe(false);
        expect(isValidImageSrc('   ')).toBe(false);
        expect(isValidImageSrc('\t\n')).toBe(false);
      });

      it('should return false for text that is not a URL', () => {
        expect(isValidImageSrc('John Doe')).toBe(false);
        expect(isValidImageSrc('JD')).toBe(false);
        expect(isValidImageSrc('user123')).toBe(false);
        expect(isValidImageSrc('some text')).toBe(false);
      });

      it('should return false for URLs without http/https prefix', () => {
        expect(isValidImageSrc('example.com/image.jpg')).toBe(false);
        expect(isValidImageSrc('www.example.com/image.png')).toBe(false);
        expect(isValidImageSrc('ftp://example.com/image.jpg')).toBe(false);
      });

      it('should return false for relative URLs not starting with /', () => {
        expect(isValidImageSrc('images/avatar.jpg')).toBe(false);
        expect(isValidImageSrc('./images/avatar.png')).toBe(false);
        expect(isValidImageSrc('../images/avatar.gif')).toBe(false);
      });

      it('should return false for invalid data URLs', () => {
        expect(isValidImageSrc('data:text/plain;base64,SGVsbG8gV29ybGQ=')).toBe(
          false,
        );
        expect(isValidImageSrc('data:image/')).toBe(false);
        expect(isValidImageSrc('data:image/png')).toBe(false);
        expect(isValidImageSrc('data:')).toBe(false);
      });
    });

    describe('Edge cases', () => {
      it('should handle strings with only whitespace around valid URLs', () => {
        expect(isValidImageSrc('  https://example.com/image.jpg  ')).toBe(true);
        expect(isValidImageSrc('\t/image.png\n')).toBe(true);
      });

      it('should handle case sensitivity', () => {
        expect(isValidImageSrc('HTTP://EXAMPLE.COM/IMAGE.JPG')).toBe(true);
        expect(isValidImageSrc('HTTPS://EXAMPLE.COM/IMAGE.PNG')).toBe(true);
        expect(isValidImageSrc('DATA:IMAGE/PNG;BASE64,ABC')).toBe(true);
      });
    });
  });

  describe('parseDayjs', () => {
    // Existing tests for parseDayjs can be added here if needed
    it('should parse dayjs objects', () => {
      const dayjsObj = parseDayjs('2023-01-01');
      expect(dayjsObj.isValid()).toBe(true);
    });
  });

  describe('isNullOrUndefined', () => {
    // Existing tests for isNullOrUndefined can be added here if needed
    it('should return true for null and undefined', () => {
      expect(isNullOrUndefined(null)).toBe(true);
      expect(isNullOrUndefined(undefined)).toBe(true);
      expect(isNullOrUndefined('')).toBe(false);
      expect(isNullOrUndefined(0)).toBe(false);
    });
  });
});
