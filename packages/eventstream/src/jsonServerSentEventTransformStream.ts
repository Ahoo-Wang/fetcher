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

import { ServerSentEvent } from './serverSentEventTransformStream';
import { ServerSentEventStream } from './eventStreamConverter';

export interface JsonServerSentEvent<DATA>
  extends Omit<ServerSentEvent, 'data'> {
  data: DATA;
}

export class JsonServerSentEventTransform<DATA>
  implements Transformer<ServerSentEvent, JsonServerSentEvent<DATA>> {
  transform(
    chunk: ServerSentEvent,
    controller: TransformStreamDefaultController<JsonServerSentEvent<DATA>>,
  ) {
    const json = JSON.parse(chunk.data) as DATA;
    controller.enqueue({
      data: json,
      event: chunk.event,
      id: chunk.id,
      retry: chunk.retry,
    });
  }
}

export class JsonServerSentEventTransformStream<DATA> extends TransformStream<
  ServerSentEvent,
  JsonServerSentEvent<DATA>
> {
  constructor() {
    super(new JsonServerSentEventTransform());
  }
}

export type JsonServerSentEventStream<DATA> = ReadableStream<
  JsonServerSentEvent<DATA>
>;

export function toJsonServerSentEventStream<DATA>(
  serverSentEventStream: ServerSentEventStream,
): JsonServerSentEventStream<DATA> {
  return serverSentEventStream.pipeThrough(
    new JsonServerSentEventTransformStream<DATA>(),
  );
}
