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

/**
 * A model of the parts of CoSec 8.0's wire contract the client depends on. It
 * is written from CoSec's `StatusMapping`, `ProblemEncoder`, `CoSecParameters`
 * and the IDN/SCP rules and `wiki/integration/clients.md`, not from a running
 * CoSec: it proves the client against the contract as read, nothing more.
 */

export interface ProblemRow {
  readonly status: number;
  readonly title: string;
}

/** `ProblemType`: slug, status and title of the ten types. */
export const PROBLEM_ROWS: Record<string, ProblemRow> = {
  'invalid-request': { status: 400, title: 'Invalid Request' },
  unauthorized: { status: 401, title: 'Unauthorized' },
  'token-invalid': { status: 401, title: 'Token Invalid' },
  'token-expired': { status: 401, title: 'Token Expired' },
  'token-revoked': { status: 401, title: 'Token Revoked' },
  forbidden: { status: 403, title: 'Forbidden' },
  'scope-rejected': { status: 403, title: 'Scope Rejected' },
  'too-many-requests': { status: 429, title: 'Too Many Requests' },
  unavailable: { status: 503, title: 'Service Unavailable' },
  'internal-error': { status: 500, title: 'Internal Server Error' },
};

export interface ProblemOptions {
  requestId?: string;
  traceId?: string;
  headers?: Record<string, string>;
}

/**
 * The refusal CoSec answers: `application/problem+json` whose members are
 * `type`, `title`, `status`, `code`, `requestId` and then `traceId`, in this
 * order and nothing else (`ProblemEncoder`), with the `CoSec-Request-Id` header.
 * A `429` carries `Retry-After` (pass it in `headers`).
 */
export function problemResponse(
  slug: string,
  { requestId = 'req-1', traceId, headers = {} }: ProblemOptions = {},
): Response {
  const row = PROBLEM_ROWS[slug];
  const body: Record<string, unknown> = {
    type: `https://cosec.ahoo.me/problems/${slug}`,
    title: row.title,
    status: row.status,
    code: slug.toUpperCase().replaceAll('-', '_'),
    requestId,
  };
  if (traceId) body.traceId = traceId;
  return new Response(JSON.stringify(body), {
    status: row.status,
    headers: {
      'Content-Type': 'application/problem+json',
      'CoSec-Request-Id': requestId,
      ...headers,
    },
  });
}

function base64Url(value: unknown): string {
  return btoa(JSON.stringify(value))
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replace(/=+$/, '');
}

/** An unsigned JWT with the given claims (the client never verifies one). */
export function jwt(claims: Record<string, unknown>): string {
  return `${base64Url({ alg: 'none' })}.${base64Url(claims)}.signature`;
}
