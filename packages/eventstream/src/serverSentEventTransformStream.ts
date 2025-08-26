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

export enum ServerSentEventField {
  ID = 'id',
  RETRY = 'retry',
  EVENT = 'event',
  DATA = 'data',
}

/**
 * Process field value
 * @param field Field name
 * @param value Field value
 * @param currentEvent Current event state
 */
function processFieldInternal(
  field: string,
  value: string,
  currentEvent: EventState,
) {
  switch (field) {
    case ServerSentEventField.EVENT:
      currentEvent.event = value;
      break;
    case ServerSentEventField.DATA:
      currentEvent.data.push(value);
      break;
    case ServerSentEventField.ID:
      currentEvent.id = value;
      break;
    case ServerSentEventField.RETRY: {
      const retryValue = parseInt(value, 10);
      if (!isNaN(retryValue)) {
        currentEvent.retry = retryValue;
      }
      break;
    }
    default:
      // Ignore unknown fields
      break;
  }
}

interface EventState {
  event?: string;
  id?: string;
  retry?: number;
  data: string[];
}

/**
 * Transformer responsible for converting a string stream into a ServerSentEvent object stream.
 *
 * Implements the Transformer interface for processing data transformation in TransformStream.
 */
export class ServerSentEventTransformer
  implements Transformer<string, ServerSentEvent>
{
  // Initialize currentEvent with default values in a closure
  private currentEvent: EventState = {
    event: 'message',
    id: undefined,
    retry: undefined,
    data: [],
  };

  /**
   * Transform input string chunk into ServerSentEvent object.
   *
   * @param chunk Input string chunk
   * @param controller Controller for controlling the transform stream
   */
  transform(
    chunk: string,
    controller: TransformStreamDefaultController<ServerSentEvent>,
  ) {
    const currentEvent = this.currentEvent;
    try {
      // Skip empty lines (event separator)
      if (chunk.trim() === '') {
        // If there is accumulated event data, send event
        if (currentEvent.data.length > 0) {
          controller.enqueue({
            event: currentEvent.event || 'message',
            data: currentEvent.data.join('\n'),
            id: currentEvent.id || '',
            retry: currentEvent.retry,
          } as ServerSentEvent);

          // Reset current event (preserve id and retry for subsequent events)
          currentEvent.event = 'message';
          // Preserve id and retry for subsequent events (no need to reassign to themselves)
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
        // No colon, entire line as field name, value is empty
        field = chunk.toLowerCase();
        value = '';
      } else {
        // Extract field name and value
        field = chunk.substring(0, colonIndex).toLowerCase();
        value = chunk.substring(colonIndex + 1);

        // If value starts with space, remove leading space
        if (value.startsWith(' ')) {
          value = value.substring(1);
        }
      }

      // Remove trailing newlines from field and value
      field = field.trim();
      value = value.trim();

      processFieldInternal(field, value, currentEvent);
    } catch (error) {
      controller.error(
        error instanceof Error ? error : new Error(String(error)),
      );
      // Reset state
      currentEvent.event = 'message';
      currentEvent.id = undefined;
      currentEvent.retry = undefined;
      currentEvent.data = [];
    }
  }

  /**
   * Called when the stream ends, used to process remaining data.
   *
   * @param controller Controller for controlling the transform stream
   */
  flush(controller: TransformStreamDefaultController<ServerSentEvent>) {
    const currentEvent = this.currentEvent;
    try {
      // Send the last event (if any)
      if (currentEvent.data.length > 0) {
        controller.enqueue({
          event: currentEvent.event || 'message',
          data: currentEvent.data.join('\n'),
          id: currentEvent.id || '',
          retry: currentEvent.retry,
        } as ServerSentEvent);
      }
    } catch (error) {
      controller.error(
        error instanceof Error ? error : new Error(String(error)),
      );
    } finally {
      // Reset state
      currentEvent.event = 'message';
      currentEvent.id = undefined;
      currentEvent.retry = undefined;
      currentEvent.data = [];
    }
  }
}

/**
 * A TransformStream that converts a stream of strings into a stream of ServerSentEvent objects.
 */
export class ServerSentEventTransformStream extends TransformStream<
  string,
  ServerSentEvent
> {
  constructor() {
    super(new ServerSentEventTransformer());
  }
}
