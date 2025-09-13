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

import {
  EventStreamConvertError,
  type ServerSentEventStream,
  toServerSentEventStream,
} from './eventStreamConverter';
import {
  type JsonServerSentEventStream,
  toJsonServerSentEventStream,
} from './jsonServerSentEventTransformStream';
import { CONTENT_TYPE_HEADER, ContentTypeValues } from '@ahoo-wang/fetcher';

declare global {
  interface Response {
    /**
     * Gets the content type of the response.
     *
     * This property provides access to the Content-Type header of the response,
     * which indicates the media type of the resource transmitted in the response.
     *
     * @returns The content type header value as a string, or null if the header is not set
     */
    get contentType(): string | null;

    /**
     * Checks if the response is an event stream.
     *
     * This property examines the Content-Type header to determine if the response
     * contains server-sent events data (text/event-stream).
     *
     * @returns true if the response is an event stream, false otherwise
     */
    get isEventStream(): boolean;

    /**
     * Returns a ServerSentEventStream for consuming server-sent events.
     *
     * This method is added to Response objects by the EventStreamInterceptor
     * when the response content type indicates a server-sent event stream.
     *
     * @returns A ReadableStream of ServerSentEvent objects, or null if not an event stream
     */
    eventStream(): ServerSentEventStream | null;

    /**
     * Returns a ServerSentEventStream for consuming server-sent events.
     *
     * This method is similar to eventStream() but will throw an error if the event stream is not available.
     * It is added to Response objects by the EventStreamInterceptor when the response content type
     * indicates a server-sent event stream.
     *
     * @returns A ReadableStream of ServerSentEvent objects
     * @throws {Error} if the event stream is not available
     */
    requiredEventStream(): ServerSentEventStream;

    /**
     * Returns a JsonServerSentEventStream for consuming server-sent events with JSON data.
     *
     * This method is added to Response objects by the EventStreamInterceptor
     * when the response content type indicates a server-sent event stream.
     *
     * @template DATA - The type of the JSON data in the server-sent events
     * @returns A ReadableStream of ServerSentEvent objects with JSON data, or null if not an event stream
     */
    jsonEventStream<DATA>(): JsonServerSentEventStream<DATA> | null;

    /**
     * Returns a JsonServerSentEventStream for consuming server-sent events with JSON data.
     *
     * This method is similar to jsonEventStream() but will throw an error if the event stream is not available.
     * It is added to Response objects by the EventStreamInterceptor when the response content type
     * indicates a server-sent event stream with JSON data.
     *
     * @template DATA - The type of the JSON data in the server-sent events
     * @returns A ReadableStream of ServerSentEvent objects with JSON data
     * @throws {Error} if the event stream is not available
     */
    requiredJsonEventStream<DATA>(): JsonServerSentEventStream<DATA>;
  }
}

/**
 * Defines the contentType property on Response prototype.
 * This property provides a convenient way to access the Content-Type header value.
 */
Object.defineProperty(Response.prototype, 'contentType', {
  get() {
    return this.headers.get(CONTENT_TYPE_HEADER);
  },
});

/**
 * Defines the isEventStream property on Response prototype.
 * This property checks if the response has a Content-Type header indicating it's an event stream.
 */
Object.defineProperty(Response.prototype, 'isEventStream', {
  get() {
    const contentType = this.contentType;
    if (!contentType) {
      return false;
    }
    return contentType.includes(ContentTypeValues.TEXT_EVENT_STREAM);
  },
});

/**
 * Implementation of the eventStream method for Response objects.
 * Converts a Response with text/event-stream content type to a ServerSentEventStream.
 *
 * @returns A ServerSentEventStream if the response is an event stream, null otherwise
 */
Response.prototype.eventStream = function() {
  if (!this.isEventStream) {
    return null;
  }
  return toServerSentEventStream(this);
};

/**
 * Implementation of the requiredEventStream method for Response objects.
 * Converts a Response with text/event-stream content type to a ServerSentEventStream,
 * throwing an error if the response is not an event stream.
 *
 * @returns A ServerSentEventStream if the response is an event stream
 * @throws {Error} if the response is not an event stream
 */
Response.prototype.requiredEventStream = function() {
  const eventStream = this.eventStream();
  if (!eventStream) {
    throw new EventStreamConvertError(
      this,
      `Event stream is not available. Response content-type: [${this.contentType}]`,
    );
  }
  return eventStream;
};

/**
 * Implementation of the jsonEventStream method for Response objects.
 * Converts a Response with text/event-stream content type to a JsonServerSentEventStream.
 *
 * @template DATA - The type of the JSON data in the server-sent events
 * @returns A JsonServerSentEventStream if the response is an event stream, null otherwise
 */
Response.prototype.jsonEventStream = function <DATA>() {
  const eventStream = this.eventStream();
  if (!eventStream) {
    return null;
  }
  return toJsonServerSentEventStream<DATA>(eventStream);
};

/**
 * Implementation of the requiredJsonEventStream method for Response objects.
 * Converts a Response with text/event-stream content type to a JsonServerSentEventStream,
 * throwing an error if the response is not an event stream.
 *
 * @template DATA - The type of the JSON data in the server-sent events
 * @returns A JsonServerSentEventStream if the response is an event stream
 * @throws {Error} if the response is not an event stream
 */
Response.prototype.requiredJsonEventStream = function <DATA>() {
  const eventStream = this.jsonEventStream<DATA>();
  if (!eventStream) {
    throw new EventStreamConvertError(
      this,
      `Event stream is not available. Response content-type: [${this.contentType}]`,
    );
  }
  return eventStream;
};