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
import { AccessToken, CompositeToken, RefreshToken, TokenRefresher, } from '../src';

describe('tokenRefresher.ts', () => {
  describe('AccessToken', () => {
    it('should define AccessToken interface', () => {
      // This is a type-only interface, so we just verify it compiles
      const token: AccessToken = {
        accessToken: 'test-access-token',
      };
      expect(token.accessToken).toBe('test-access-token');
    });
  });

  describe('RefreshToken', () => {
    it('should define RefreshToken interface', () => {
      // This is a type-only interface, so we just verify it compiles
      const token: RefreshToken = {
        refreshToken: 'test-refresh-token',
      };
      expect(token.refreshToken).toBe('test-refresh-token');
    });
  });

  describe('CompositeToken', () => {
    it('should define CompositeToken interface', () => {
      // This is a type-only interface, so we just verify it compiles
      const token: CompositeToken = {
        accessToken: 'test-access-token',
        refreshToken: 'test-refresh-token',
      };
      expect(token.accessToken).toBe('test-access-token');
      expect(token.refreshToken).toBe('test-refresh-token');
    });
  });

  describe('TokenRefresher', () => {
    it('should define TokenRefresher interface', async () => {
      // This is a type-only interface, so we just verify it compiles
      const refresher: TokenRefresher = {
        refresh: async (token: CompositeToken) => token,
      };

      const testToken: CompositeToken = {
        accessToken: 'test-access-token',
        refreshToken: 'test-refresh-token',
      };

      const result = await refresher.refresh(testToken);
      expect(result).toEqual(testToken);
    });
  });
});
