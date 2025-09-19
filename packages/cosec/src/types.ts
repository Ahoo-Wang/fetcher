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

import { DeviceIdStorage } from './deviceIdStorage';
import { JwtTokenManager } from './jwtTokenManager';

/**
 * CoSec HTTP headers enumeration.
 */
export class CoSecHeaders {
  static readonly DEVICE_ID = 'CoSec-Device-Id';
  static readonly APP_ID = 'CoSec-App-Id';
  static readonly AUTHORIZATION = 'Authorization';
  static readonly REQUEST_ID = 'CoSec-Request-Id';
}

export class ResponseCodes {
  static readonly UNAUTHORIZED = 401;
}

export interface AppIdCapable {
  /**
   * Application ID to be sent in the CoSec-App-Id header.
   */
  appId: string;
}

export interface DeviceIdStorageCapable {
  deviceIdStorage: DeviceIdStorage;
}

export interface JwtTokenManagerCapable {
  tokenManager: JwtTokenManager;
}

/**
 * CoSec options interface.
 */
export interface CoSecOptions
  extends AppIdCapable,
    DeviceIdStorageCapable,
    JwtTokenManagerCapable {
}

/**
 * Authorization result interface.
 */
export interface AuthorizeResult {
  authorized: boolean;
  reason: string;
}

/**
 * Authorization result constants.
 */
export const AuthorizeResults = {
  ALLOW: { authorized: true, reason: 'Allow' },
  EXPLICIT_DENY: { authorized: false, reason: 'Explicit Deny' },
  IMPLICIT_DENY: { authorized: false, reason: 'Implicit Deny' },
  TOKEN_EXPIRED: { authorized: false, reason: 'Token Expired' },
  TOO_MANY_REQUESTS: { authorized: false, reason: 'Too Many Requests' },
};
