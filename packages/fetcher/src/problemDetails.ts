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

import { ContentTypeValues } from './fetchRequest.js';

/**
 * A problem details object (RFC 9457, which obsoletes RFC 7807): the body of
 * an `application/problem+json` response, describing an HTTP API error.
 *
 * {@link readProblemDetails} returns it with the standard members checked:
 * one of the wrong type is left out, as the RFC says to ignore it, and `type`
 * defaults to `'about:blank'`. Extension members are kept as sent.
 *
 * @see https://www.rfc-editor.org/rfc/rfc9457
 *
 * @example
 * ```typescript
 * try {
 *   await fetcher.post('/orders', { body: order });
 * } catch (error) {
 *   if (error instanceof HttpStatusValidationError && error.problem) {
 *     showError(error.problem.detail ?? error.problem.title);
 *   }
 * }
 * ```
 */
export interface ProblemDetails {
  /**
   * A URI reference identifying the problem type; `'about:blank'` when the
   * response gives none, meaning the problem is just its HTTP status.
   */
  type: string;
  /** A short, human-readable summary of the problem type. */
  title?: string;
  /**
   * The HTTP status code the server meant. Advisory: the response's own
   * status is the one that counts.
   */
  status?: number;
  /** A human-readable explanation specific to this occurrence. */
  detail?: string;
  /** A URI reference identifying this occurrence of the problem. */
  instance?: string;
  /** Extension members, as the server sent them. */
  [extension: string]: unknown;
}

/** The problem type of a problem that is just its HTTP status. */
export const ABOUT_BLANK_PROBLEM_TYPE = 'about:blank';

const STRING_MEMBERS = ['title', 'detail', 'instance'] as const;

/**
 * Whether `response` is labelled `application/problem+json`, in any case and
 * with any parameters (`application/problem+json; charset=utf-8`).
 */
export function isProblemDetailsResponse(response: Response): boolean {
  const contentType = response.headers.get('content-type');
  if (!contentType) return false;
  return (
    contentType.split(';')[0].trim().toLowerCase() ===
    ContentTypeValues.APPLICATION_PROBLEM_JSON
  );
}

/**
 * The problem details of a response labelled `application/problem+json`, or
 * `undefined` for any other response.
 *
 * It reads a copy of the body, so the response itself stays unread. It never
 * rejects: a body that is used already, cannot be read, is not JSON or is not
 * a JSON object gives `undefined`, so reading the details of a failure never
 * replaces that failure.
 *
 * @param response - The response to read
 * @returns The problem details, standard members checked, or `undefined`
 */
export async function readProblemDetails(
  response: Response,
): Promise<ProblemDetails | undefined> {
  if (!isProblemDetailsResponse(response)) return undefined;
  let body: unknown;
  try {
    body = await response.clone().json();
  } catch {
    return undefined;
  }
  return toProblemDetails(body);
}

/**
 * `body` as problem details: `undefined` unless it is a JSON object; a
 * standard member of the wrong type is left out, and `type` defaults to
 * `'about:blank'`.
 */
export function toProblemDetails(body: unknown): ProblemDetails | undefined {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    return undefined;
  }
  // A spread defines `__proto__` from JSON as an own property; it never
  // reaches the prototype.
  const problem: Record<string, unknown> = { ...body };
  if (typeof problem.type !== 'string') {
    problem.type = ABOUT_BLANK_PROBLEM_TYPE;
  }
  for (const member of STRING_MEMBERS) {
    if (member in problem && typeof problem[member] !== 'string') {
      delete problem[member];
    }
  }
  if ('status' in problem && !Number.isInteger(problem.status)) {
    delete problem.status;
  }
  return problem as ProblemDetails;
}
