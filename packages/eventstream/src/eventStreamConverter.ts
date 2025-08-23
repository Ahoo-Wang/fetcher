import { TextLineTransformStream } from './textLineTransformStream';
import {
  ServerSentEvent,
  ServerSentEventTransformStream,
} from './serverSentEventTransformStream';

/**
 * ServerSentEventStream is a ReadableStream of ServerSentEvent objects
 */
export type ServerSentEventStream = ReadableStream<ServerSentEvent>;

export function toServerSentEventStream(
  response: Response,
): ServerSentEventStream {
  if (!response.body) {
    throw new Error('Response body is null');
  }

  // Process the response body through a series of transform streams:
  // 1. TextDecoderStream: Decode Uint8Array data to UTF-8 strings
  // 2. TextLineStream: Split text by lines
  // 3. ServerSentEventStream: Parse line data into server-sent events
  return response.body
    .pipeThrough(new TextDecoderStream('utf-8'))
    .pipeThrough(new TextLineTransformStream())
    .pipeThrough(new ServerSentEventTransformStream());
}
