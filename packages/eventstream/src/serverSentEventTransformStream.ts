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
 * This interface defines the structure of Server-Sent Events (SSE) as specified by the W3C.
 * Each event contains metadata and data that can be processed by clients to handle real-time
 * updates from the server.
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
 *
 * This class provides string constants for the standard SSE field names as defined
 * in the W3C Server-Sent Events specification. These constants help ensure
 * consistent field name usage throughout the parsing logic.
 */
export class ServerSentEventFields {
  /** The field name for event ID */
  static readonly ID = 'id';
  /** The field name for retry interval */
  static readonly RETRY = 'retry';
  /** The field name for event type */
  static readonly EVENT = 'event';
  /** The field name for event data */
  static readonly DATA = 'data';
}

/**
 * Processes a field-value pair and updates the current event state accordingly.
 *
 * This internal function handles the parsing of individual SSE fields according to the
 * Server-Sent Events specification. It updates the provided event state object with
 * the parsed field values.
 *
 * @param field - The field name (e.g., 'event', 'data', 'id', 'retry')
 * @param value - The field value as a string
 * @param currentEvent - The current event state object to update
 *
 * @example
 * ```typescript
 * const eventState: EventState = { event: 'message', data: [] };
 * processFieldInternal('event', 'custom', eventState);
 * // eventState.event is now 'custom'
 * ```
 */
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
      // Ignore unknown fields
      break;
  }
}

/**
 * Internal state representation during Server-Sent Event parsing.
 *
 * This interface tracks the current state of an event being parsed from the SSE stream.
 * It accumulates field values until a complete event is ready to be emitted.
 */
interface EventState {
  /** The event type (defaults to 'message') */
  event?: string;
  /** The event ID */
  id?: string;
  /** The retry interval in milliseconds */
  retry?: number;
  /** Array of data lines that will be joined with newlines */
  data: string[];
}

const DEFAULT_EVENT_TYPE = 'message';

/**
 * Transformer responsible for converting a string stream into a ServerSentEvent object stream.
 *
 * Implements the Transformer interface for processing data transformation in TransformStream.
 * This transformer handles the parsing of Server-Sent Events (SSE) according to the W3C specification.
 * It processes incoming text chunks and converts them into structured ServerSentEvent objects.
 */
export class ServerSentEventTransformer
  implements Transformer<string, ServerSentEvent>
{
  // Initialize currentEventState with default values in a closure
  private currentEventState: EventState = {
    event: DEFAULT_EVENT_TYPE,
    id: undefined,
    retry: undefined,
    data: [],
  };

  /**
   * Reset the current event state to default values.
   * This method is called after processing each complete event or when an error occurs.
   */
  private resetEventState() {
    this.currentEventState.event = DEFAULT_EVENT_TYPE;
    this.currentEventState.id = undefined;
    this.currentEventState.retry = undefined;
    this.currentEventState.data = [];
  }

  /**
   * Transform input string chunk into ServerSentEvent object.
   * This method processes individual chunks of text data, parsing them according to the SSE format.
   * It handles:
   * - Empty lines (used as event separators)
   * - Comment lines (starting with ':')
   * - Field lines (field: value format)
   * - Event completion and emission
   *
   * @param chunk Input string chunk
   * @param controller Controller for controlling the transform stream
   */
  transform(
    chunk: string,
    controller: TransformStreamDefaultController<ServerSentEvent>,
  ) {
    const currentEvent = this.currentEventState;
    try {
      // Skip empty lines (event separator)
      if (chunk.trim() === '') {
        // If there is accumulated event data, send event
        if (currentEvent.data.length > 0) {
          controller.enqueue({
            event: currentEvent.event || DEFAULT_EVENT_TYPE,
            data: currentEvent.data.join('\n'),
            id: currentEvent.id || '',
            retry: currentEvent.retry,
          } as ServerSentEvent);

          // Reset current event (preserve id and retry for subsequent events)
          currentEvent.event = DEFAULT_EVENT_TYPE;
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
      const enhancedError = new Error(
        `Failed to process chunk: "${chunk}". ${error instanceof Error ? error.message : String(error)}`,
      );
      controller.error(enhancedError);
      // Reset state
      this.resetEventState();
    }
  }

  /**
   * Called when the stream ends, used to process remaining data.
   *
   * @param controller Controller for controlling the transform stream
   */
  flush(controller: TransformStreamDefaultController<ServerSentEvent>) {
    const currentEvent = this.currentEventState;
    try {
      // Send the last event (if any)
      if (currentEvent.data.length > 0) {
        controller.enqueue({
          event: currentEvent.event || DEFAULT_EVENT_TYPE,
          data: currentEvent.data.join('\n'),
          id: currentEvent.id || '',
          retry: currentEvent.retry,
        } as ServerSentEvent);
      }
    } catch (error) {
      const enhancedError = new Error(
        `Failed to flush remaining data. ${error instanceof Error ? error.message : String(error)}`,
      );
      controller.error(enhancedError);
    } finally {
      // Reset state
      this.resetEventState();
    }
  }
}

/**
 * A TransformStream that converts a stream of strings into a stream of ServerSentEvent objects.
 *
 * This class provides a convenient way to transform raw text streams containing Server-Sent Events
 * into structured event objects. It wraps the ServerSentEventTransformer in a TransformStream
 * for easy integration with other stream processing pipelines.
 *
 * The stream processes SSE format text and emits ServerSentEvent objects as they are completed.
 * Events are separated by empty lines, and the stream handles partial events across multiple chunks.
 *
 * @example
 * ```typescript
 * // Create a transform stream
 * const sseStream = new ServerSentEventTransformStream();
 *
 * // Pipe a text stream through it
 * const eventStream = textStream.pipeThrough(sseStream);
 *
 * // Consume the events
 * for await (const event of eventStream) {
 *   console.log('Event:', event.event, 'Data:', event.data);
 * }
 * ```
 */
export class ServerSentEventTransformStream extends TransformStream<
  string,
  ServerSentEvent
> {
  /**
   * Creates a new ServerSentEventTransformStream instance.
   *
   * Initializes the stream with a ServerSentEventTransformer that handles
   * the parsing of SSE format text into structured events.
   */
  constructor() {
    super(new ServerSentEventTransformer());
  }
}
