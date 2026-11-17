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
import type { ChatRequest, ChatResponse, Choice, Message } from '../../src';

// Nullable protocol values are accepted.
const toolCall: Message = {
  role: 'assistant',
  content: null,
  tool_calls: [
    {
      id: 'call-local',
      type: 'function',
      function: { name: 'lookup', arguments: '{}' },
    },
  ],
};
export const followUp: ChatRequest = {
  model: 'local-fixture',
  messages: [{ role: 'user', content: 'Look it up' }, toolCall],
};
export const choice: Choice = {
  index: 0,
  delta: { content: null },
  finish_reason: null,
};
export const chunk: ChatResponse = {
  id: 'chat-local',
  object: 'chat.completion.chunk',
  created: 1,
  choices: [choice],
  usage: null,
};

// Excluding only undefined is not enough to dereference them.
declare const response: ChatResponse;
declare const message: Message;
declare const streamed: Choice;
if (response.usage !== undefined) {
  // @ts-expect-error usage is null on all but the last include_usage chunk.
  void response.usage.total_tokens;
}
if (message.content !== undefined) {
  // @ts-expect-error content is null on a tool-call message.
  void message.content.trim();
}
if (streamed.finish_reason !== undefined) {
  // @ts-expect-error finish_reason is null until the choice ends.
  void streamed.finish_reason.toUpperCase();
}

// Excluding null as well narrows them to the value types.
export const totalTokens: number | undefined = response.usage?.total_tokens;
export const text: string | undefined = message.content ?? undefined;
export const reason: string = streamed.finish_reason ?? 'pending';
