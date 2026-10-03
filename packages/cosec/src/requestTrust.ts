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

import { type FetchExchange, isAbsoluteURL } from '@ahoo-wang/fetcher';

/** Exchange attribute holding the trust decided for it, per predicate. */
const REQUEST_TRUST_ATTRIBUTE = 'CoSec-Request-Trust';

/**
 * Decides whether a request to an absolute URL may carry CoSec credentials
 * (the `Authorization` token and the CoSec headers, device ID included).
 *
 * @param url - The request's absolute URL, before path parameters are filled
 * @param exchange - The exchange being sent
 */
export type RequestTrust = (url: string, exchange: FetchExchange) => boolean;

export interface RequestTrustCapable {
  /**
   * Which absolute request URLs may carry CoSec credentials. By default every
   * request carries them. Pass {@link sameOriginTrust} (or your own
   * predicate) to keep the token and device ID from reaching other origins —
   * a pagination link, a download URL, a callback. A relative request URL
   * goes to the fetcher's own `baseURL` and is always trusted.
   */
  readonly isTrusted?: RequestTrust;
}

function originOf(url: string): string | undefined {
  try {
    return new URL(url, globalThis.location?.href).origin;
  } catch {
    return undefined;
  }
}

/**
 * Trusts an absolute URL on the origin of the fetcher's `baseURL`, or on the
 * page's own origin. Any other origin — a pagination link, a download URL,
 * a callback — gets no credentials.
 *
 * @example
 * ```typescript
 * new CoSecConfigurer({ appId, tokenRefresher, isTrusted: sameOriginTrust });
 * ```
 */
export const sameOriginTrust: RequestTrust = (url, exchange) => {
  const target = originOf(url);
  if (!target || target === 'null') return false;
  const baseURL = exchange.fetcher.urlBuilder.baseURL;
  return (
    (isAbsoluteURL(baseURL) && originOf(baseURL) === target) ||
    globalThis.location?.origin === target
  );
};

/**
 * Whether `exchange` may carry CoSec credentials: without `isTrusted`, every
 * request may; with it, a relative request URL always may (it resolves
 * against the configured `baseURL`) and an absolute one when `isTrusted`
 * accepts it.
 */
export function isTrustedRequest(
  exchange: FetchExchange,
  isTrusted?: RequestTrust,
): boolean {
  if (!isTrusted) return true;
  // Trust is decided once per exchange, on its first pass through the request
  // chain: a retry (after a 401 refresh) sees the URL already resolved
  // against the baseURL, and must not lose the credentials the original
  // relative URL was trusted with.
  let decisions: Map<RequestTrust, boolean> | undefined =
    exchange.attributes.get(REQUEST_TRUST_ATTRIBUTE);
  const decided = decisions?.get(isTrusted);
  if (decided !== undefined) return decided;
  const url = exchange.request.url;
  const trusted = !isAbsoluteURL(url) || isTrusted(url, exchange);
  if (!decisions) {
    decisions = new Map();
    exchange.attributes.set(REQUEST_TRUST_ATTRIBUTE, decisions);
  }
  decisions.set(isTrusted, trusted);
  return trusted;
}
