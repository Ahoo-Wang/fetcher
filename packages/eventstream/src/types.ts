import { ServerSentEventStream } from './eventStreamConverter';

declare global {
  interface Response {
    eventStream?(): ServerSentEventStream;
  }

  interface ReadableStream<R = any> {
    [Symbol.asyncIterator](): AsyncIterator<R>;
  }
}
