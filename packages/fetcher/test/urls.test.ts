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
import {
  isAbsoluteURL,
  combineURLs,
  extractPathParams,
  interpolateUrl,
} from '../src';

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

  describe('extractPathParams', () => {
    it('should return empty array when no path parameters exist', () => {
      expect(extractPathParams('/users/profile')).toEqual([]);
      expect(extractPathParams('https://api.example.com/users')).toEqual([]);
    });

    it('should return array with one parameter when URL contains one path parameter', () => {
      expect(extractPathParams('/users/{id}')).toEqual(['id']);
      expect(
        extractPathParams('https://api.example.com/users/{userId}'),
      ).toEqual(['userId']);
    });

    it('should return array with multiple parameters when URL contains multiple path parameters', () => {
      expect(extractPathParams('/users/{id}/posts/{postId}')).toEqual([
        'id',
        'postId',
      ]);
      expect(
        extractPathParams('https://api.example.com/{resource}/{id}/details'),
      ).toEqual(['resource', 'id']);
    });

    it('should return empty array when URL is empty string', () => {
      expect(extractPathParams('')).toEqual([]);
    });

    it('should extract parameters with special characters', () => {
      expect(
        extractPathParams('/api/{version}/users/{user_id}/details'),
      ).toEqual(['version', 'user_id']);
      expect(extractPathParams('/{category-name}/{sub-category}')).toEqual([
        'category-name',
        'sub-category',
      ]);
    });

    it('should extract all parameters when URL contains only path parameters', () => {
      expect(extractPathParams('{first}/{second}/{third}')).toEqual([
        'first',
        'second',
        'third',
      ]);
    });
  });

  describe('interpolateUrl', () => {
    it('should return original URL when path parameters are not provided', () => {
      expect(interpolateUrl('/users/{id}/posts/{postId}')).toBe(
        '/users/{id}/posts/{postId}',
      );
      expect(interpolateUrl('/users/{id}/posts/{postId}', null)).toBe(
        '/users/{id}/posts/{postId}',
      );
      expect(interpolateUrl('/users/{id}/posts/{postId}', undefined)).toBe(
        '/users/{id}/posts/{postId}',
      );
    });

    it('should replace placeholders with provided values', () => {
      expect(interpolateUrl('/users/{id}', { id: 123 })).toBe('/users/123');
      expect(
        interpolateUrl('/users/{id}/posts/{postId}', { id: 123, postId: 456 }),
      ).toBe('/users/123/posts/456');
      expect(
        interpolateUrl('https://api.example.com/{resource}/{id}', {
          resource: 'users',
          id: 123,
        }),
      ).toBe('https://api.example.com/users/123');
    });

    it('should handle different data types for parameter values', () => {
      expect(interpolateUrl('/items/{id}', { id: 'abc' })).toBe('/items/abc');
      expect(interpolateUrl('/items/{flag}', { flag: true })).toBe(
        '/items/true',
      );
      expect(interpolateUrl('/items/{count}', { count: 0 })).toBe('/items/0');
    });

    it('should throw error when required path parameter is missing', () => {
      expect(() => interpolateUrl('/users/{id}', { name: 'John' })).toThrow(
        'Missing required path parameter: id',
      );
      expect(() =>
        interpolateUrl('/users/{id}/posts/{postId}', { id: 123 }),
      ).toThrow('Missing required path parameter: postId');
    });
  });
});
