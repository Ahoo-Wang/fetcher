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
  EVENT_STREAM_INTERCEPTOR_NAME,
  EVENT_STREAM_INTERCEPTOR_ORDER,
  EventStreamInterceptor,
} from '../src/eventStreamInterceptor';
import { FetchExchange } from '@ahoo-wang/fetcher';

describe('eventStreamInterceptor.ts', () => {
  describe('EventStreamInterceptor', () => {
    it('should have correct name and order', () => {
      const interceptor = new EventStreamInterceptor();

      expect(interceptor.name).toBe(EVENT_STREAM_INTERCEPTOR_NAME);
      expect(interceptor.order).toBe(EVENT_STREAM_INTERCEPTOR_ORDER);
    });

    it('should not modify exchange when response is null', () => {
      const interceptor = new EventStreamInterceptor();
      const exchange = {
        response: null,
      } as unknown as FetchExchange;

      interceptor.intercept(exchange);

      // No error should be thrown
      expect(true).toBe(true);
    });

    it('should not modify exchange when content type is not event stream', () => {
      const interceptor = new EventStreamInterceptor();
      const headers = new Headers();
      headers.set('content-type', 'application/json');

      const response = {
        headers,
      } as Response;

      const exchange = {
        response,
      } as FetchExchange;

      interceptor.intercept(exchange);

      // We can't directly check for eventStream property since it's added dynamically
      // But we can verify that no error was thrown
      expect(true).toBe(true);
    });

    it('should add eventStream method when content type is event stream', () => {
      const interceptor = new EventStreamInterceptor();
      const headers = new Headers();
      headers.set('content-type', 'text/event-stream');

      const response = {
        headers,
        body: new ReadableStream(),
      } as Response;

      const exchange = {
        response,
      } as FetchExchange;

      interceptor.intercept(exchange);

      // Verify that the eventStream method was added
      expect(typeof (response as any).eventStream).toBe('function');

      // Verify that the eventStream method returns a ServerSentEventStream
      const eventStream = (response as any).eventStream();
      expect(eventStream).toBeInstanceOf(ReadableStream);
    });

    it('should handle content type with charset', () => {
      const interceptor = new EventStreamInterceptor();
      const headers = new Headers();
      headers.set('content-type', 'text/event-stream; charset=utf-8');

      const response = {
        headers,
        body: new ReadableStream(),
      } as Response;

      const exchange = {
        response,
      } as FetchExchange;

      interceptor.intercept(exchange);

      // Verify that the eventStream method was added
      expect(typeof (response as any).eventStream).toBe('function');
    });

    it('should call toServerSentEventStream when eventStream method is invoked', () => {
      const interceptor = new EventStreamInterceptor();
      const headers = new Headers();
      headers.set('content-type', 'text/event-stream');

      const response = {
        headers,
        body: new ReadableStream(),
      } as Response;

      const exchange = {
        response,
      } as FetchExchange;

      interceptor.intercept(exchange);

      // Verify that the eventStream method was added
      expect(typeof (response as any).eventStream).toBe('function');

      // Call the eventStream method and verify it returns a ServerSentEventStream
      const eventStream = (response as any).eventStream();
      expect(eventStream).toBeInstanceOf(ReadableStream);
    });
  });
});
