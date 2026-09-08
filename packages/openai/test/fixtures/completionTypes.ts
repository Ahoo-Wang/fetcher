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
import type { ChatClient, ChatRequest, ChatResponse } from '../../src';
import type { JsonServerSentEventStream } from '@ahoo-wang/fetcher-eventstream';
type Equal<T, U> =
  (<V>() => V extends T ? 1 : 2) extends <V>() => V extends U ? 1 : 2
    ? true
    : false;
type Assert<T extends true> = T;
type Stream = JsonServerSentEventStream<ChatResponse>;
declare const client: ChatClient;
declare const flag: boolean;
declare const request: ChatRequest;
const body = { model: 'test', messages: [] };
const streaming = client.completions({ ...body, stream: true });
const nonStreaming = client.completions({ ...body, stream: false });
const omitted = client.completions(body);
const unset = client.completions({ ...body, stream: undefined });
const dynamic = client.completions({ ...body, stream: flag });
const broad = client.completions(request);
declare const unionRequest: (typeof body & { stream: true }) | typeof body;
const union = client.completions(unionRequest);
type Streaming = Assert<Equal<typeof streaming, Promise<Stream>>>;
type NonStreaming = Assert<Equal<typeof nonStreaming, Promise<ChatResponse>>>;
type Omitted = Assert<Equal<typeof omitted, Promise<ChatResponse>>>;
type Unset = Assert<Equal<typeof unset, Promise<ChatResponse>>>;
type Dynamic = Assert<Equal<typeof dynamic, Promise<ChatResponse | Stream>>>;
type Broad = Assert<Equal<typeof broad, Promise<ChatResponse | Stream>>>;
type Union = Assert<Equal<typeof union, Promise<ChatResponse | Stream>>>;
// @ts-expect-error A broad request may return a stream.
const unsafe: Promise<ChatResponse> = broad;
// @ts-expect-error A request union may select its streaming member.
const unsafeUnion: Promise<ChatResponse> = union;
