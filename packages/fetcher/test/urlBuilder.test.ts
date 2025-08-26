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
});
