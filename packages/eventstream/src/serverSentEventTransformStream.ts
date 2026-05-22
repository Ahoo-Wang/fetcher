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

import { SafeTransformer } from './safeTransformer';

/**
 * Represents a message sent in an event stream.
 *
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events#Event_stream_format}
 */
export interface ServerSentEvent {
  /** The event ID to set the EventSource object's last event ID value. */
  id?: string;
  /** A string identifying the type of event described. */
  event: string;
  /** The event data */
  data: string;
  /** The reconnection interval (in milliseconds) to wait before retrying the connection */
  retry?: number;
}

/**
 * Constants for Server-Sent Event field names.
 */
export class ServerSentEventFields {
  static readonly ID = 'id';
  static readonly RETRY = 'retry';
  static readonly EVENT = 'event';
  static readonly DATA = 'data';
}

function processFieldInternal(
  field: string,
  value: string,
  currentEvent: EventState,
) {
  switch (field) {
    case ServerSentEventFields.EVENT:
      currentEvent.event = value;
      break;
    case ServerSentEventFields.DATA:
      currentEvent.data.push(value);
      break;
    case ServerSentEventFields.ID:
      currentEvent.id = value;
      break;
    case ServerSentEventFields.RETRY: {
      const retryValue = parseInt(value, 10);
      if (!isNaN(retryValue)) {
        currentEvent.retry = retryValue;
      }
      break;
    }
    default:
      break;
  }
}

interface EventState {
  event?: string;
  id?: string;
  retry?: number;
  data: string[];
}

const DEFAULT_EVENT_TYPE = 'message';

/**
 * Transformer responsible for converting a string stream into a
 * ServerSentEvent object stream, following the W3C SSE specification.
 */
export class ServerSentEventTransformer extends SafeTransformer<
  string,
  ServerSentEvent
> {
  private currentEventState: EventState = {
    event: DEFAULT_EVENT_TYPE,
    id: undefined,
    retry: undefined,
    data: [],
  };

  private resetEventState() {
    this.currentEventState.event = DEFAULT_EVENT_TYPE;
    this.currentEventState.id = undefined;
    this.currentEventState.retry = undefined;
    this.currentEventState.data = [];
  }

  protected onTransform(
    chunk: string,
    controller: TransformStreamDefaultController<ServerSentEvent>,
  ): void {
    const currentEvent = this.currentEventState;

    // Skip empty lines (event separator)
    if (chunk.trim() === '') {
      if (currentEvent.data.length > 0) {
        this.enqueue(controller, {
          event: currentEvent.event || DEFAULT_EVENT_TYPE,
          data: currentEvent.data.join('\n'),
          id: currentEvent.id || '',
          retry: currentEvent.retry,
        } as ServerSentEvent);

        currentEvent.event = DEFAULT_EVENT_TYPE;
        currentEvent.data = [];
      }
      return;
    }

    // Ignore comment lines (starting with colon)
    if (chunk.startsWith(':')) {
      return;
    }

    // Parse fields
    const colonIndex = chunk.indexOf(':');
    let field: string;
    let value: string;

    if (colonIndex === -1) {
      field = chunk.toLowerCase();
      value = '';
    } else {
      field = chunk.substring(0, colonIndex).toLowerCase();
      value = chunk.substring(colonIndex + 1);
      if (value.startsWith(' ')) {
        value = value.substring(1);
      }
    }

    field = field.trim();
    value = value.trim();

    processFieldInternal(field, value, currentEvent);
  }

  protected onFlush(
    controller: TransformStreamDefaultController<ServerSentEvent>,
  ): void {
    const currentEvent = this.currentEventState;
    try {
      if (currentEvent.data.length > 0) {
        this.enqueue(controller, {
          event: currentEvent.event || DEFAULT_EVENT_TYPE,
          data: currentEvent.data.join('\n'),
          id: currentEvent.id || '',
          retry: currentEvent.retry,
        } as ServerSentEvent);
      }
    } finally {
      this.resetEventState();
    }
  }
}

/**
 * A TransformStream that converts a stream of strings into a stream of
 * ServerSentEvent objects.
 */
export class ServerSentEventTransformStream extends TransformStream<
  string,
  ServerSentEvent
> {
  constructor() {
    super(new ServerSentEventTransformer());
  }
}
