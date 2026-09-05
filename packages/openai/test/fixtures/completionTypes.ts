/*
 * Copyright [2021-present] [ahoo wang <ahoowang@qq.com> (https://github.com/Ahoo-Wang)].
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *      http://www.apache.org/licenses/LICENSE-2.0
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
type Streaming = Assert<Equal<typeof streaming, Promise<Stream>>>;
type NonStreaming = Assert<Equal<typeof nonStreaming, Promise<ChatResponse>>>;
type Omitted = Assert<Equal<typeof omitted, Promise<ChatResponse>>>;
type Unset = Assert<Equal<typeof unset, Promise<ChatResponse>>>;
type Dynamic = Assert<Equal<typeof dynamic, Promise<ChatResponse | Stream>>>;
type Broad = Assert<Equal<typeof broad, Promise<ChatResponse | Stream>>>;
// @ts-expect-error A broad request may return a stream.
const unsafe: Promise<ChatResponse> = broad;
