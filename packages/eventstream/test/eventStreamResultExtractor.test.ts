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
import { JsonServerSentEventStream, ServerSentEventStream } from '../src';
import { ExchangeError, FetchExchange, FetchRequest } from '@ahoo-wang/fetcher';
import { EventStreamResultExtractor, JsonEventStreamResultExtractor } from '../src';

describe('EventStreamResultExtractor', () => {
  const mockRequest = { url: '/test' } as FetchRequest;

  it('should return ServerSentEventStream when response supports event stream', () => {
    const eventStreamResponse = new Response('');

    // Mock the requiredEventStream function on the response
    const mockEventStream = {} as ServerSentEventStream;
    Object.defineProperty(eventStreamResponse, 'requiredEventStream', {
      configurable: true,
      enumerable: true,
      value: () => mockEventStream,
    });

    const eventStreamExchange = new FetchExchange(
      {
        fetcher: {} as any,
        request: mockRequest,
        response: eventStreamResponse,
      },
    );

    const result = EventStreamResultExtractor(eventStreamExchange);
    expect(result).toBe(mockEventStream);
  });

  it('should throw ExchangeError when server does not support ServerSentEventStream', () => {
    const noEventStreamResponse = new Response('');
    // Mock the requiredEventStream function to throw ExchangeError
    Object.defineProperty(noEventStreamResponse, 'requiredEventStream', {
      configurable: true,
      enumerable: true,
      value: () => {
        throw new ExchangeError(
          new FetchExchange({
            fetcher: {} as any, request: mockRequest, response: noEventStreamResponse,
          }),
          'ServerSentEventStream is not supported',
        );
      },
    });

    const noEventStreamExchange = new FetchExchange(
      {
        fetcher: {} as any,
        request: mockRequest,
        response: noEventStreamResponse,
      },
    );

    expect(() => EventStreamResultExtractor(noEventStreamExchange)).toThrow(
      ExchangeError,
    );
  });
});

describe('JsonEventStreamResultExtractor', () => {
  const mockRequest = { url: '/test' } as FetchRequest;
  it('should return JsonServerSentEventStream when response supports json event stream', () => {
    const jsonEventStreamResponse = new Response('');

    // Mock the requiredJsonEventStream function on the response
    const mockJsonEventStream = {} as JsonServerSentEventStream<any>;
    Object.defineProperty(
      jsonEventStreamResponse,
      'requiredJsonEventStream',
      {
        configurable: true,
        enumerable: true,
        value: () => mockJsonEventStream,
      },
    );

    const jsonEventStreamExchange = new FetchExchange(
      {
        fetcher: {} as any,
        request: mockRequest,
        response: jsonEventStreamResponse,
      },
    );

    const result = JsonEventStreamResultExtractor(jsonEventStreamExchange);
    expect(result).toBe(mockJsonEventStream);
  });

  it('should throw ExchangeError when server does not support JsonServerSentEventStream', () => {
    const noJsonEventStreamResponse = new Response('');
    // Mock the requiredJsonEventStream function to throw ExchangeError
    Object.defineProperty(
      noJsonEventStreamResponse,
      'requiredJsonEventStream',
      {
        configurable: true,
        enumerable: true,
        value: () => {
          throw new ExchangeError(
            new FetchExchange(
              {
                fetcher: {} as any,
                request: mockRequest,
                response: noJsonEventStreamResponse,
              },
            ),
            'JsonServerSentEventStream is not supported',
          );
        },
      },
    );

    const noJsonEventStreamExchange = new FetchExchange(
      {
        fetcher: {} as any,
        request: mockRequest,
        response: noJsonEventStreamResponse,
      },
    );

    expect(() =>
      JsonEventStreamResultExtractor(noJsonEventStreamExchange),
    ).toThrow(ExchangeError);
  });
});