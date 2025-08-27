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
import {
  AuthorizeResult,
  AuthorizeResults,
  CompositeToken,
  CoSecHeaders,
  CoSecOptions,
  DeviceIdStorage,
  ResponseCodes,
  TokenStorage,
} from '../src';

describe('types.ts', () => {
  describe('CoSecHeaders', () => {
    it('should define CoSecHeaders enum values', () => {
      expect(CoSecHeaders.DEVICE_ID).toBe('CoSec-Device-Id');
      expect(CoSecHeaders.APP_ID).toBe('CoSec-App-Id');
      expect(CoSecHeaders.AUTHORIZATION).toBe('Authorization');
      expect(CoSecHeaders.REQUEST_ID).toBe('CoSec-Request-Id');
    });
  });

  describe('ResponseCodes', () => {
    it('should define ResponseCodes enum values', () => {
      expect(ResponseCodes.UNAUTHORIZED).toBe(401);
    });
  });

  describe('AuthorizeResults', () => {
    it('should define AuthorizeResults constants', () => {
      expect(AuthorizeResults.ALLOW).toEqual({
        authorized: true,
        reason: 'Allow',
      });
      expect(AuthorizeResults.EXPLICIT_DENY).toEqual({
        authorized: false,
        reason: 'Explicit Deny',
      });
      expect(AuthorizeResults.IMPLICIT_DENY).toEqual({
        authorized: false,
        reason: 'Implicit Deny',
      });
      expect(AuthorizeResults.TOKEN_EXPIRED).toEqual({
        authorized: false,
        reason: 'Token Expired',
      });
      expect(AuthorizeResults.TOO_MANY_REQUESTS).toEqual({
        authorized: false,
        reason: 'Too Many Requests',
      });
    });
  });

  describe('CoSecOptions', () => {
    it('should define CoSecOptions interface', () => {
      // This is a type-only interface, so we just verify it compiles
      const options: CoSecOptions = {
        appId: 'test-app-id',
        deviceIdStorage: new DeviceIdStorage(),
        tokenStorage: new TokenStorage(),
        tokenRefresher: {
          refresh: async (token: CompositeToken) => token,
        },
      };
      expect(options.appId).toBe('test-app-id');
    });
  });

  describe('AuthorizeResult', () => {
    it('should define AuthorizeResult interface', () => {
      // This is a type-only interface, so we just verify it compiles
      const result: AuthorizeResult = {
        authorized: true,
        reason: 'Test reason',
      };
      expect(result.authorized).toBe(true);
      expect(result.reason).toBe('Test reason');
    });
  });
});
