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

import { describe, expect, it } from 'vitest';
import { UrlBuilder } from '../src';

describe('UrlBuilder', () => {
  describe('constructor', () => {
    it('should create UrlBuilder with baseURL', () => {
      const urlBuilder = new UrlBuilder('https://api.example.com');
      expect(urlBuilder.baseURL).toBe('https://api.example.com');
    });
  });

  describe('build', () => {
    it('should build URL with base URL only', () => {
      const urlBuilder = new UrlBuilder('https://api.example.com');
      const url = urlBuilder.build('');
      expect(url).toBe('https://api.example.com');
    });

    it('should build URL with path', () => {
      const urlBuilder = new UrlBuilder('https://api.example.com');
      const url = urlBuilder.build('/users');
      expect(url).toBe('https://api.example.com/users');
    });

    it('should build URL with path parameters', () => {
      const urlBuilder = new UrlBuilder('https://api.example.com');
      const url = urlBuilder.build('/users/{id}', { path: { id: 123 } });
      expect(url).toBe('https://api.example.com/users/123');
    });

    it('should build URL with query parameters', () => {
      const urlBuilder = new UrlBuilder('https://api.example.com');
      const url = urlBuilder.build('/users', {
        query: { filter: 'active', page: '1' },
      });
      expect(url).toBe('https://api.example.com/users?filter=active&page=1');
    });

    it('should build URL with path parameters and query parameters', () => {
      const urlBuilder = new UrlBuilder('https://api.example.com');
      const url = urlBuilder.build('/users/{id}', {
        path: { id: 123 },
        query: { filter: 'active' },
      });
      expect(url).toBe('https://api.example.com/users/123?filter=active');
    });

    it('should throw error when missing required path parameter', () => {
      const urlBuilder = new UrlBuilder('https://api.example.com');
      expect(() => urlBuilder.build('/users/{id}', { path: {} })).toThrow(
        'Missing required path parameter: id',
      );
    });

    it('should handle absolute URLs correctly', () => {
      const urlBuilder = new UrlBuilder('https://api.example.com');
      const url = urlBuilder.build('http://other.com/users');
      expect(url).toBe('http://other.com/users');
    });

    it('should handle URL with multiple path parameters', () => {
      const urlBuilder = new UrlBuilder('https://api.example.com');
      const url = urlBuilder.build('/users/{userId}/posts/{postId}', {
        path: { userId: 123, postId: 456 },
      });
      expect(url).toBe('https://api.example.com/users/123/posts/456');
    });

    it('should handle URL with array query parameters', () => {
      const urlBuilder = new UrlBuilder('https://api.example.com');
      const url = urlBuilder.build('/users', {
        query: { tags: ['important', 'urgent'], status: 'active' },
      });
      // URLSearchParams will serialize arrays by joining with commas
      expect(url).toBe(
        'https://api.example.com/users?tags=important%2Curgent&status=active',
      );
    });

    it('should handle URL with numeric query parameters', () => {
      const urlBuilder = new UrlBuilder('https://api.example.com');
      const url = urlBuilder.build('/users', {
        query: { page: 1, limit: 10 },
      });
      expect(url).toBe('https://api.example.com/users?page=1&limit=10');
    });

    it('should handle URL with boolean query parameters', () => {
      const urlBuilder = new UrlBuilder('https://api.example.com');
      const url = urlBuilder.build('/users', {
        query: { active: true, deleted: false },
      });
      expect(url).toBe(
        'https://api.example.com/users?active=true&deleted=false',
      );
    });

    it('should handle URL with null/undefined query parameters', () => {
      const urlBuilder = new UrlBuilder('https://api.example.com');
      const url = urlBuilder.build('/users', {
        query: { name: null, status: undefined, active: 'yes' },
      });
      // URLSearchParams will convert null to string and include undefined as 'undefined'
      expect(url).toBe(
        'https://api.example.com/users?name=null&status=undefined&active=yes',
      );
    });

    it('should handle URL with empty query parameters object', () => {
      const urlBuilder = new UrlBuilder('https://api.example.com');
      const url = urlBuilder.build('/users', {
        query: {},
      });
      expect(url).toBe('https://api.example.com/users');
    });

    it('should handle URL with empty path parameters object', () => {
      const urlBuilder = new UrlBuilder('https://api.example.com');
      const url = urlBuilder.build('/users', {
        path: {},
      });
      expect(url).toBe('https://api.example.com/users');
    });

    it('should handle URL without any parameters', () => {
      const urlBuilder = new UrlBuilder('https://api.example.com');
      const url = urlBuilder.build('/users');
      expect(url).toBe('https://api.example.com/users');
    });

    it('should handle URL with special characters in path parameters', () => {
      const urlBuilder = new UrlBuilder('https://api.example.com');
      const url = urlBuilder.build('/users/{id}', {
        path: { id: 'user@domain.com' },
      });
      expect(url).toBe('https://api.example.com/users/user@domain.com');
    });

    it('should handle URL with special characters in query parameters', () => {
      const urlBuilder = new UrlBuilder('https://api.example.com');
      const url = urlBuilder.build('/search', {
        query: { q: 'hello world & more' },
      });
      expect(url).toBe('https://api.example.com/search?q=hello+world+%26+more');
    });
  });

  describe('interpolateUrl', () => {
    it('should return original URL when path is undefined', () => {
      const urlBuilder = new UrlBuilder('https://api.example.com');
      const url = urlBuilder.interpolateUrl('/users/{id}');
      expect(url).toBe('/users/{id}');
    });

    it('should return original URL when path is null', () => {
      const urlBuilder = new UrlBuilder('https://api.example.com');
      const url = urlBuilder.interpolateUrl('/users/{id}', null);
      expect(url).toBe('/users/{id}');
    });

    it('should replace single path parameter', () => {
      const urlBuilder = new UrlBuilder('https://api.example.com');
      const url = urlBuilder.interpolateUrl('/users/{id}', { id: 123 });
      expect(url).toBe('/users/123');
    });

    it('should replace multiple path parameters', () => {
      const urlBuilder = new UrlBuilder('https://api.example.com');
      const url = urlBuilder.interpolateUrl('/users/{userId}/posts/{postId}', {
        userId: 123,
        postId: 456,
      });
      expect(url).toBe('/users/123/posts/456');
    });

    it('should throw error when required path parameter is missing', () => {
      const urlBuilder = new UrlBuilder('https://api.example.com');
      expect(() => urlBuilder.interpolateUrl('/users/{id}', {})).toThrow(
        'Missing required path parameter: id',
      );
    });

    it('should throw error when required path parameter is undefined', () => {
      const urlBuilder = new UrlBuilder('https://api.example.com');
      expect(() =>
        urlBuilder.interpolateUrl('/users/{id}', { id: undefined }),
      ).toThrow('Missing required path parameter: id');
    });

    it('should handle path parameter with special characters', () => {
      const urlBuilder = new UrlBuilder('https://api.example.com');
      const url = urlBuilder.interpolateUrl('/users/{id}', {
        id: 'user@domain.com',
      });
      expect(url).toBe('/users/user@domain.com');
    });

    it('should handle URL without placeholders', () => {
      const urlBuilder = new UrlBuilder('https://api.example.com');
      const url = urlBuilder.interpolateUrl('/users/list', { id: 123 });
      expect(url).toBe('/users/list');
    });

    it('should handle empty URL', () => {
      const urlBuilder = new UrlBuilder('https://api.example.com');
      const url = urlBuilder.interpolateUrl('', { id: 123 });
      expect(url).toBe('');
    });
  });

  describe('resolveRequestUrl', () => {
    it('should resolve request URL with urlParams', () => {
      const urlBuilder = new UrlBuilder('https://api.example.com');
      const request: any = {
        url: '/users/{id}',
        urlParams: {
          path: { id: 123 },
          query: { filter: 'active' },
        },
      };
      const url = urlBuilder.resolveRequestUrl(request);
      expect(url).toBe('https://api.example.com/users/123?filter=active');
    });

    it('should resolve request URL without urlParams', () => {
      const urlBuilder = new UrlBuilder('https://api.example.com');
      const request: any = {
        url: '/users',
      };
      const url = urlBuilder.resolveRequestUrl(request);
      expect(url).toBe('https://api.example.com/users');
    });

    it('should resolve request URL with only path parameters', () => {
      const urlBuilder = new UrlBuilder('https://api.example.com');
      const request: any = {
        url: '/users/{id}',
        urlParams: {
          path: { id: 123 },
        },
      };
      const url = urlBuilder.resolveRequestUrl(request);
      expect(url).toBe('https://api.example.com/users/123');
    });

    it('should resolve request URL with only query parameters', () => {
      const urlBuilder = new UrlBuilder('https://api.example.com');
      const request: any = {
        url: '/users',
        urlParams: {
          query: { filter: 'active' },
        },
      };
      const url = urlBuilder.resolveRequestUrl(request);
      expect(url).toBe('https://api.example.com/users?filter=active');
    });
  });
});
