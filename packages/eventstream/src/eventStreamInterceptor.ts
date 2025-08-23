import { toServerSentEventStream } from './eventStreamConverter';
import {
  ContentTypeHeader,
  ContentTypeValues,
  FetchExchange,
  Interceptor,
} from '@ahoo-wang/fetcher';

export class EventStreamInterceptor implements Interceptor {
  intercept(exchange: FetchExchange): FetchExchange {
    // Check if the response is an event stream
    const response = exchange.response;
    if (!response) {
      return exchange;
    }
    const contentType = response.headers.get(ContentTypeHeader);
    if (
      contentType &&
      contentType.includes(ContentTypeValues.TEXT_EVENT_STREAM)
    ) {
      // Add eventStream method to response
      response.eventStream = () => toServerSentEventStream(response);
    }
    return exchange;
  }
}
