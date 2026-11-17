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
import { type Fetcher, ResultExtractors } from '@ahoo-wang/fetcher';
import {
  type ApiMetadata,
  EndpointReturnType,
} from '@ahoo-wang/fetcher-decorator';
import { ChatClient, type ChatClientOptions } from '../../src';

declare const fetcher: Fetcher;

// Options that keep the completions() return type are accepted.
export const defaults = new ChatClient();
export const configured = new ChatClient({
  fetcher,
  basePath: 'chat',
  headers: { 'X-Trace': '1' },
  timeout: 1000,
});
export const named = new ChatClient({ fetcher: 'openai' });
export const options: ChatClientOptions | undefined = configured.apiMetadata;

// Options that change what completions() returns are rejected.
export const response = new ChatClient({
  fetcher,
  // @ts-expect-error completions() would return the Response.
  resultExtractor: ResultExtractors.Response,
});
export const exchange = new ChatClient({
  fetcher,
  // @ts-expect-error completions() would return the FetchExchange.
  returnType: EndpointReturnType.EXCHANGE,
});
declare const metadata: ApiMetadata;
// @ts-expect-error An ApiMetadata may carry either option.
export const anyMetadata = new ChatClient(metadata);
