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

import { describe, expect, it, beforeEach, vi } from 'vitest';
import { toServerSentEventStream } from '../src';
import { toJsonServerSentEventStream } from '../src';
import '../src/responses';
import { CONTENT_TYPE_HEADER, ContentTypeValues } from '@ahoo-wang/fetcher';

// Mock the converter functions to avoid dealing with actual stream processing
vi.mock('../src/eventStreamConverter', () => ({
  toServerSentEventStream: vi.fn(),
}));

vi.mock('../src/jsonServerSentEventTransformStream', () => ({
  toJsonServerSentEventStream: vi.fn(),
}));

// Helper function to setup mocks
function setupMocks() {
  // Setup mock to return a stream for event-stream content type
  (toServerSentEventStream as any).mockImplementation((response: {
    headers: { get: (arg0: string) => string | string[]; };
  }) => {
    if (response.headers.get(CONTENT_TYPE_HEADER)?.includes(ContentTypeValues.TEXT_EVENT_STREAM)) {
      return new ReadableStream();
    }
    return null;
  });
}

describe('responses.ts', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();
    setupMocks();
  });

  describe('contentType property', () => {
    it('should return the content-type header value', () => {
      const headers = new Headers();
      headers.set(CONTENT_TYPE_HEADER, 'text/event-stream');
      const response = new Response('test', { headers });

      expect(response.contentType).toBe('text/event-stream');
    });
  });

  describe('isEventStream property', () => {
    it('should return true for event stream content type', () => {
      const headers = new Headers();
      headers.set(CONTENT_TYPE_HEADER, ContentTypeValues.TEXT_EVENT_STREAM);
      const response = new Response('test', { headers });

      expect(response.isEventStream).toBe(true);
    });

    it('should return true for event stream content type with charset', () => {
      const headers = new Headers();
      headers.set(CONTENT_TYPE_HEADER, 'text/event-stream; charset=utf-8');
      const response = new Response('test', { headers });

      expect(response.isEventStream).toBe(true);
    });

    it('should return false for non-event stream content type', () => {
      const headers = new Headers();
      headers.set(CONTENT_TYPE_HEADER, 'application/json');
      const response = new Response('test', { headers });

      expect(response.isEventStream).toBe(false);
    });

    it('should return false when content-type header is not set', () => {
      // Create a response without any headers
      const response = new Response('test');

      expect(response.isEventStream).toBe(false);
    });

    it('should return false when content-type header is empty string', () => {
      const headers = new Headers();
      headers.set(CONTENT_TYPE_HEADER, '');
      const response = new Response('test', { headers });
      
      expect(response.isEventStream).toBe(false);
    });
  });

  describe('eventStream method', () => {
    it('should return a ServerSentEventStream for event stream responses', () => {
      const headers = new Headers();
      headers.set(CONTENT_TYPE_HEADER, ContentTypeValues.TEXT_EVENT_STREAM);
      const response = new Response('test', { headers });

      const eventStream = response.eventStream();

      expect(eventStream).toBeInstanceOf(ReadableStream);
      expect(toServerSentEventStream).toHaveBeenCalledWith(response);
    });

    it('should return null for non-event stream responses', () => {
      const headers = new Headers();
      headers.set(CONTENT_TYPE_HEADER, 'application/json');
      const response = new Response('test', { headers });

      const eventStream = response.eventStream();

      expect(eventStream).toBeNull();
      expect(toServerSentEventStream).not.toHaveBeenCalled();
    });
  });

  describe('requiredEventStream method', () => {
    it('should return a ServerSentEventStream for event stream responses', () => {
      const headers = new Headers();
      headers.set(CONTENT_TYPE_HEADER, ContentTypeValues.TEXT_EVENT_STREAM);
      const response = new Response('test', { headers });

      const eventStream = response.requiredEventStream();

      expect(eventStream).toBeInstanceOf(ReadableStream);
      expect(toServerSentEventStream).toHaveBeenCalledWith(response);
    });

    it('should throw an error for non-event stream responses', () => {
      const headers = new Headers();
      headers.set(CONTENT_TYPE_HEADER, 'application/json');
      const response = new Response('test', { headers });

      expect(() => response.requiredEventStream()).toThrow('Event stream is not available.');
    });
  });

  describe('jsonEventStream method', () => {
    it('should return a JsonServerSentEventStream for event stream responses', () => {
      // Setup additional mock for JSON transformation
      (toJsonServerSentEventStream as any).mockReturnValue(new ReadableStream());

      const headers = new Headers();
      headers.set(CONTENT_TYPE_HEADER, ContentTypeValues.TEXT_EVENT_STREAM);
      const response = new Response('test', { headers });

      const jsonEventStream = response.jsonEventStream<any>();

      expect(jsonEventStream).toBeInstanceOf(ReadableStream);
      expect(toServerSentEventStream).toHaveBeenCalledWith(response);
      expect(toJsonServerSentEventStream).toHaveBeenCalled();
    });

    it('should return null for non-event stream responses', () => {
      const headers = new Headers();
      headers.set(CONTENT_TYPE_HEADER, 'application/json');
      const response = new Response('test', { headers });

      const jsonEventStream = response.jsonEventStream<any>();

      expect(jsonEventStream).toBeNull();
      expect(toServerSentEventStream).not.toHaveBeenCalled();
      expect(toJsonServerSentEventStream).not.toHaveBeenCalled();
    });
  });

  describe('requiredJsonEventStream method', () => {
    it('should return a JsonServerSentEventStream for event stream responses', () => {
      // Setup additional mock for JSON transformation
      (toJsonServerSentEventStream as any).mockReturnValue(new ReadableStream());

      const headers = new Headers();
      headers.set(CONTENT_TYPE_HEADER, ContentTypeValues.TEXT_EVENT_STREAM);
      const response = new Response('test', { headers });

      const jsonEventStream = response.requiredJsonEventStream<any>();

      expect(jsonEventStream).toBeInstanceOf(ReadableStream);
      expect(toServerSentEventStream).toHaveBeenCalledWith(response);
      expect(toJsonServerSentEventStream).toHaveBeenCalled();
    });

    it('should throw an error for non-event stream responses', () => {
      const headers = new Headers();
      headers.set(CONTENT_TYPE_HEADER, 'application/json');
      const response = new Response('test', { headers });

      expect(() => response.requiredJsonEventStream<any>()).toThrow('Event stream is not available.');
    });
  });

  describe('ReadableStream async iterator', () => {
    it('should be defined', () => {
      const stream = new ReadableStream();
      expect(stream[Symbol.asyncIterator]).toBeDefined();
      expect(typeof stream[Symbol.asyncIterator]).toBe('function');
    });
  });
});