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

/** @deprecated `@ahoo-wang/fetcher-cosec` moved to `@ahoo-wang/cosec-fetcher` in the CoSec repository and is removed in the next fetcher major. See https://cosec.ahoo.me/integration/clients. */
export class RefreshTokenError extends FetcherError {
  constructor(
    public readonly token: JwtCompositeToken,
    cause?: Error | any,
  ) {
    super(`Refresh token failed.`, cause);
    this.name = 'RefreshTokenError';
  }
}

/**
 * The session changed while refreshing; the original request must stop.
 *
 * @deprecated `@ahoo-wang/fetcher-cosec` moved to `@ahoo-wang/cosec-fetcher` in the CoSec repository and is removed in the next fetcher major. See https://cosec.ahoo.me/integration/clients.
 */
export class RefreshSessionChangedError extends FetcherError {
  constructor(cause?: unknown) {
    super('The token session changed during refresh.', cause);
    this.name = 'RefreshSessionChangedError';
  }
}

/**
 * The refresh could not complete — a network failure, a timeout, an abort, a
 * 5xx — but the server did not reject the refresh token, so the session is
 * kept and no unauthorized notification is sent. A later request refreshes
 * again. Only a 4xx answer from the refresh endpoint (or a malformed refresh
 * response) ends the session with {@link RefreshTokenError}.
 *
 * @deprecated `@ahoo-wang/fetcher-cosec` moved to `@ahoo-wang/cosec-fetcher` in the CoSec repository and is removed in the next fetcher major. See https://cosec.ahoo.me/integration/clients.
 */
export class RefreshUnavailableError extends FetcherError {
  constructor(
    public readonly token: JwtCompositeToken,
    cause?: Error | any,
  ) {
    super('Refresh token is unavailable; the session is kept.', cause);
    this.name = 'RefreshUnavailableError';
  }
}

/**
 * The refresh endpoint answered, but not with a composite token.
 *
 * @deprecated `@ahoo-wang/fetcher-cosec` moved to `@ahoo-wang/cosec-fetcher` in the CoSec repository and is removed in the next fetcher major. See https://cosec.ahoo.me/integration/clients.
 */
export class InvalidRefreshResponseError extends Error {
  constructor() {
    super('The refresh response has no accessToken and refreshToken.');
    this.name = 'InvalidRefreshResponseError';
  }
}

/**
 * A request answered 401 could not be retried after the refresh, because its
 * body (a `ReadableStream` or another async iterable) was consumed by the
 * first attempt. The session was refreshed: send the request again with a
 * new body.
 *
 * @deprecated `@ahoo-wang/fetcher-cosec` moved to `@ahoo-wang/cosec-fetcher` in the CoSec repository and is removed in the next fetcher major. See https://cosec.ahoo.me/integration/clients.
 */
export class NonReplayableRequestError extends FetcherError {
  constructor() {
    super(
      'The request body can be sent only once; the token was refreshed, send the request again with a new body.',
    );
    this.name = 'NonReplayableRequestError';
  }
}
