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

import { FetcherError } from '@ahoo-wang/fetcher';
import type { JwtCompositeToken } from './jwtToken.js';

export class RefreshTokenError extends FetcherError {
  constructor(
    public readonly token: JwtCompositeToken,
    cause?: Error | any,
  ) {
    super(`Refresh token failed.`, cause);
    this.name = 'RefreshTokenError';
  }
}

/** The session changed while refreshing; the original request must stop. */
export class RefreshSessionChangedError extends FetcherError {
  constructor(cause?: unknown) {
    super('The token session changed during refresh.', cause);
    this.name = 'RefreshSessionChangedError';
  }
}
