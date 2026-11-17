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
  ABOUT_BLANK_PROBLEM_TYPE,
  ContentTypeValues,
  ExchangeError,
  Fetcher,
  FetchExchange,
  HttpStatusValidationError,
  InterceptorManager,
  isProblemDetailsResponse,
  readProblemDetails,
  toProblemDetails,
  ValidateStatusInterceptor,
} from '../src';

const PROBLEM = {
  type: 'https://example.com/probs/out-of-credit',
  title: 'You do not have enough credit.',
  status: 403,
  detail: 'Your current balance is 30, but that costs 50.',
  instance: '/account/12345/msgs/abc',
  balance: 30,
  accounts: ['/account/12345', '/account/67890'],
};

function problemResponse(
  body: unknown = PROBLEM,
  status = 403,
  contentType = 'application/problem+json',
) {
  return new Response(typeof body === 'string' ? body : JSON.stringify(body), {
    status,
    headers: { 'content-type': contentType },
  });
}

function fetcherReturning(
  respond: () => Response,
  options: { problemDetails?: boolean } = {},
) {
  return new Fetcher({
    baseURL: 'https://example.test',
    fetch: async () => respond(),
    ...options,
  });
}

describe('isProblemDetailsResponse', () => {
  it.each([
    'application/problem+json',
    'application/problem+json; charset=utf-8',
    'Application/Problem+JSON',
    ' application/problem+json ;charset=utf-8',
  ])('recognizes %j', contentType => {
    expect(
      isProblemDetailsResponse(problemResponse({}, 400, contentType)),
    ).toBe(true);
  });

  it.each([
    'application/json',
    'application/problem+xml',
    'text/html',
    'application/problem+json-seq',
  ])('does not take %j', contentType => {
    expect(
      isProblemDetailsResponse(problemResponse({}, 400, contentType)),
    ).toBe(false);
  });

  it('does not take a response without a Content-Type', () => {
    expect(isProblemDetailsResponse(new Response(null, { status: 500 }))).toBe(
      false,
    );
  });

  it('has the media type among the content types', () => {
    expect(ContentTypeValues.APPLICATION_PROBLEM_JSON).toBe(
      'application/problem+json',
    );
  });
});

describe('readProblemDetails', () => {
  it('reads the standard and extension members', async () => {
    expect(await readProblemDetails(problemResponse())).toEqual(PROBLEM);
  });

  it('leaves the response body unread', async () => {
    const response = problemResponse();
    await readProblemDetails(response);
    expect(response.bodyUsed).toBe(false);
    expect(await response.json()).toEqual(PROBLEM);
  });

  it('gives undefined for a response of another type, without reading it', async () => {
    const response = problemResponse(PROBLEM, 403, 'application/json');
    expect(await readProblemDetails(response)).toBeUndefined();
    expect(response.bodyUsed).toBe(false);
  });

  it.each([
    ['not JSON', '<html>Bad gateway</html>'],
    ['a JSON array', '[1, 2]'],
    ['JSON null', 'null'],
    ['a JSON string', '"oops"'],
    ['empty', ''],
  ])('gives undefined for a body that is %s', async (_label, body) => {
    expect(await readProblemDetails(problemResponse(body))).toBeUndefined();
  });

  it('gives undefined for a body already read', async () => {
    const response = problemResponse();
    await response.text();
    expect(await readProblemDetails(response)).toBeUndefined();
  });
});

describe('toProblemDetails', () => {
  it('defaults type to about:blank', () => {
    expect(toProblemDetails({ title: 'Not Found' })).toEqual({
      type: ABOUT_BLANK_PROBLEM_TYPE,
      title: 'Not Found',
    });
    expect(ABOUT_BLANK_PROBLEM_TYPE).toBe('about:blank');
  });

  it('leaves out standard members of the wrong type, as RFC 9457 says to ignore them', () => {
    expect(
      toProblemDetails({
        type: 42,
        title: ['x'],
        status: '404',
        detail: null,
        instance: {},
        extra: 'kept',
      }),
    ).toEqual({ type: ABOUT_BLANK_PROBLEM_TYPE, extra: 'kept' });
    expect(toProblemDetails({ status: 404.5 })).toEqual({
      type: ABOUT_BLANK_PROBLEM_TYPE,
    });
  });

  it('keeps a __proto__ member as data, not as the prototype', () => {
    const problem = toProblemDetails(
      JSON.parse('{"__proto__":{"polluted":1}}'),
    );
    expect(Object.getPrototypeOf(problem)).toBe(Object.prototype);
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
    expect(Object.prototype.hasOwnProperty.call(problem, '__proto__')).toBe(
      true,
    );
  });
});

describe('problem details on HttpStatusValidationError', () => {
  it('are read onto the error of a rejected problem response', async () => {
    const fetcher = fetcherReturning(() => problemResponse());
    const error = await fetcher.get('/orders').catch(e => e);
    expect(error).toBeInstanceOf(HttpStatusValidationError);
    expect(error).toBeInstanceOf(ExchangeError);
    expect(error.problem).toEqual(PROBLEM);
    // The message and the response stay as they were.
    expect(error.message).toBe(
      'Request failed with status code 403 for https://example.test/orders',
    );
    expect(error.exchange.response.bodyUsed).toBe(false);
    expect(await error.exchange.response.json()).toEqual(PROBLEM);
  });

  it('take the response status as the one that counts', async () => {
    const fetcher = fetcherReturning(() =>
      problemResponse({ ...PROBLEM, status: 200 }, 409),
    );
    const error = await fetcher.get('/orders').catch(e => e);
    expect(error.exchange.response.status).toBe(409);
    expect(error.problem.status).toBe(200);
  });

  it('are absent for a rejected response of another type', async () => {
    const fetcher = fetcherReturning(
      () => new Response('{"error":"x"}', { status: 500 }),
    );
    const error = await fetcher.get('/orders').catch(e => e);
    expect(error).toBeInstanceOf(HttpStatusValidationError);
    expect(error.problem).toBeUndefined();
  });

  it('are absent, without failing, when the problem body is not JSON', async () => {
    const fetcher = fetcherReturning(() => problemResponse('not json', 502));
    const error = await fetcher.get('/orders').catch(e => e);
    expect(error).toBeInstanceOf(HttpStatusValidationError);
    expect(error.problem).toBeUndefined();
  });

  it('are not read with problemDetails: false', async () => {
    const fetcher = fetcherReturning(() => problemResponse(), {
      problemDetails: false,
    });
    const error = await fetcher.get('/orders').catch(e => e);
    expect(error).toBeInstanceOf(HttpStatusValidationError);
    expect(error.problem).toBeUndefined();
  });

  it('are not read for a response that passes validation', async () => {
    const fetcher = new Fetcher({
      baseURL: 'https://example.test',
      fetch: async () => problemResponse(),
      validateStatus: () => true,
    });
    const response = await fetcher.get('/orders');
    expect(response.bodyUsed).toBe(false);
    expect(await response.json()).toEqual(PROBLEM);
  });

  it('reach error interceptors, which can still recover', async () => {
    const fetcher = fetcherReturning(() => problemResponse());
    let seen: unknown;
    fetcher.interceptors.error.use({
      name: 'problem-reader',
      order: 0,
      intercept: exchange => {
        seen = (exchange.error as HttpStatusValidationError).problem?.detail;
        exchange.response = new Response('fallback');
        exchange.error = undefined;
      },
    });
    const response = await fetcher.get('/orders');
    expect(seen).toBe(PROBLEM.detail);
    expect(await response.text()).toBe('fallback');
  });

  it('are read by a ValidateStatusInterceptor and its manager options', async () => {
    const interceptor = new ValidateStatusInterceptor();
    expect(interceptor.problemDetails).toBe(true);
    expect(
      new ValidateStatusInterceptor(undefined, { problemDetails: false })
        .problemDetails,
    ).toBe(false);
    const manager = new InterceptorManager(undefined, undefined, {
      problemDetails: false,
    });
    const registered = manager.response.interceptors.find(
      candidate => candidate instanceof ValidateStatusInterceptor,
    ) as ValidateStatusInterceptor;
    expect(registered.problemDetails).toBe(false);

    const exchange = new FetchExchange({
      fetcher: new Fetcher(),
      request: { url: '/x' },
      response: problemResponse(),
    });
    await expect(interceptor.intercept(exchange)).rejects.toMatchObject({
      problem: PROBLEM,
    });
  });

  it('keep a non-problem rejection synchronous', () => {
    const exchange = new FetchExchange({
      fetcher: new Fetcher(),
      request: { url: '/x' },
      response: new Response(null, { status: 404 }),
    });
    expect(() => new ValidateStatusInterceptor().intercept(exchange)).toThrow(
      HttpStatusValidationError,
    );
  });
});
