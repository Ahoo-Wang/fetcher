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
  ResultExtractors,
  ExchangeResultExtractor,
  ResponseResultExtractor,
  JsonResultExtractor,
  TextResultExtractor,
  EventStreamResultExtractor,
  JsonEventStreamResultExtractor,
} from '../src';
import { ExchangeError, FetchExchange, FetchRequest } from '@ahoo-wang/fetcher';
import {
  ServerSentEventStream,
  JsonServerSentEventStream,
} from '@ahoo-wang/fetcher-eventstream';

describe('ResultExtractor', () => {
  const mockResponse = new Response('{"id": 1, "name": "John"}');
  const mockRequest = { url: '/test' } as FetchRequest;
  const mockExchange = new FetchExchange({} as any, mockRequest, mockResponse);

  describe('ExchangeResultExtractor', () => {
    it('should return the original FetchExchange object', () => {
      const result = ExchangeResultExtractor(mockExchange);
      expect(result).toBe(mockExchange);
    });
  });

  describe('ResponseResultExtractor', () => {
    it('should return the response object from FetchExchange', () => {
      const result = ResponseResultExtractor(mockExchange);
      expect(result).toBe(mockResponse);
    });
  });

  describe('JsonResultExtractor', () => {
    it('should parse the response content as JSON format', async () => {
      const jsonResponse = new Response(
        JSON.stringify({ id: 1, name: 'John' }),
      );
      const jsonExchange = new FetchExchange(
        {} as any,
        mockRequest,
        jsonResponse,
      );

      const result = JsonResultExtractor(jsonExchange);
      expect(result).toBeInstanceOf(Promise);

      const data = await result;
      expect(data).toEqual({ id: 1, name: 'John' });
    });
  });

  describe('TextResultExtractor', () => {
    it('should parse the response content as text format', async () => {
      const textResponse = new Response('Hello World');
      const textExchange = new FetchExchange(
        {} as any,
        mockRequest,
        textResponse,
      );

      const result = TextResultExtractor(textExchange);
      expect(result).toBeInstanceOf(Promise);

      const data = await result;
      expect(data).toBe('Hello World');
    });
  });

  describe('EventStreamResultExtractor', () => {
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
        {} as any,
        mockRequest,
        eventStreamResponse,
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
            new FetchExchange({} as any, mockRequest, noEventStreamResponse),
            'ServerSentEventStream is not supported',
          );
        },
      });

      const noEventStreamExchange = new FetchExchange(
        {} as any,
        mockRequest,
        noEventStreamResponse,
      );

      expect(() => EventStreamResultExtractor(noEventStreamExchange)).toThrow(
        ExchangeError,
      );
    });
  });

  describe('JsonEventStreamResultExtractor', () => {
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
        {} as any,
        mockRequest,
        jsonEventStreamResponse,
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
                {} as any,
                mockRequest,
                noJsonEventStreamResponse,
              ),
              'JsonServerSentEventStream is not supported',
            );
          },
        },
      );

      const noJsonEventStreamExchange = new FetchExchange(
        {} as any,
        mockRequest,
        noJsonEventStreamResponse,
      );

      expect(() =>
        JsonEventStreamResultExtractor(noJsonEventStreamExchange),
      ).toThrow(ExchangeError);
    });
  });

  describe('ResultExtractors object', () => {
    it('should contain all result extractors', () => {
      expect(ResultExtractors.Exchange).toBe(ExchangeResultExtractor);
      expect(ResultExtractors.Response).toBe(ResponseResultExtractor);
      expect(ResultExtractors.Json).toBe(JsonResultExtractor);
      expect(ResultExtractors.Text).toBe(TextResultExtractor);
      expect(ResultExtractors.EventStream).toBe(EventStreamResultExtractor);
      expect(ResultExtractors.JsonEventStream).toBe(
        JsonEventStreamResultExtractor,
      );
    });

    it('should have correct DEFAULT extractor', () => {
      expect(ResultExtractors.DEFAULT).toBe(JsonResultExtractor);
    });
  });
});
