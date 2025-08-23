import { toServerSentEventStream } from './eventStreamConverter';
import {
  ContentTypeHeader,
  ContentTypeValues,
  ResponseInterceptor,
} from '@ahoo-wang/fetcher';

export class EventStreamInterceptor implements ResponseInterceptor {
  intercept(response: Response): Response {
    // Check if the response is an event stream
    const contentType = response.headers.get(ContentTypeHeader);
    if (
      contentType &&
      contentType.includes(ContentTypeValues.TEXT_EVENT_STREAM)
    ) {
      // Add eventStream method to response
      response.eventStream = () => toServerSentEventStream(response);
    }
    return response;
  }
}
