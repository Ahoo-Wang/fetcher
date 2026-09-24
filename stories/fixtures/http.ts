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

export interface FixtureUser {
  id: string;
  name: string;
  role: 'admin' | 'member';
}

export const fixtureUsers: readonly FixtureUser[] = [
  { id: 'u-ada', name: 'Ada', role: 'admin' },
  { id: 'u-lin', name: 'Lin', role: 'member' },
];

export const fixtureSseChunks: readonly string[] = [
  'event: message\nid: chunk-1\ndata: {"id":"chat-1","choices":[{"index":0,"delta":{"content":"Hello"},"finish_reason":null}]}\n\n',
  'event: message\nid: chunk-2\ndata: {"id":"chat-1","choices":[{"index":0,"delta":{"content":" Fetcher"},"finish_reason":null}]}\n\n',
  'data: [DONE]\n\n',
];

function jsonResponse(value: unknown, status = 200): Response {
  return new Response(JSON.stringify(value), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function eventStreamResponse(
  chunks: readonly string[],
  close = true,
): Response {
  const encoder = new TextEncoder();
  return new Response(
    new ReadableStream<Uint8Array>({
      start(controller) {
        for (const chunk of chunks) controller.enqueue(encoder.encode(chunk));
        if (close) controller.close();
      },
    }),
    { headers: { 'Content-Type': 'text/event-stream' } },
  );
}

function delayedResponse(signal: AbortSignal, delay = 80): Promise<Response> {
  signal.throwIfAborted();
  return new Promise((resolve, reject) => {
    const abort = () => {
      window.clearTimeout(timer);
      reject(signal.reason);
    };
    const timer = window.setTimeout(() => {
      signal.removeEventListener('abort', abort);
      resolve(jsonResponse({ status: 'completed' }));
    }, delay);
    signal.addEventListener('abort', abort, { once: true });
  });
}

function toRequest(input: RequestInfo | URL, init?: RequestInit): Request {
  if (input instanceof Request) return new Request(input, init);
  const url = new URL(input.toString(), 'https://api.example.test');
  return new Request(url, init);
}

function installFixture(slowResponseDelay = 80): () => void {
  const originalFetch = globalThis.fetch;

  globalThis.fetch = async (input, init) => {
    const request = toRequest(input, init);
    const url = new URL(request.url);
    if (url.origin !== 'https://api.example.test')
      return originalFetch(input, init);
    request.signal.throwIfAborted();
    const { pathname } = url;

    if (pathname === '/users' && request.method === 'GET') {
      return jsonResponse(fixtureUsers);
    }

    if (pathname === '/users/search' && request.method === 'GET') {
      const query = url.searchParams.get('query') ?? '';
      return jsonResponse({
        query,
        users: fixtureUsers.filter(user =>
          user.name.toLowerCase().includes(query.toLowerCase()),
        ),
      });
    }

    if (pathname === '/users/empty') return jsonResponse([]);

    if (pathname === '/users' && request.method === 'POST') {
      const body = (await request.json()) as Omit<FixtureUser, 'id'>;
      return jsonResponse({ id: 'u-new', ...body }, 201);
    }

    const userMatch = pathname.match(/^\/users\/([^/]+)$/);
    if (userMatch) {
      if (url.searchParams.has('include')) {
        return jsonResponse({ requestUrl: url.href });
      }
      const user = fixtureUsers.find(item => item.id === userMatch[1]);
      return user
        ? jsonResponse(user)
        : jsonResponse({ message: 'User not found' }, 404);
    }

    if (pathname === '/slow') {
      return delayedResponse(request.signal, slowResponseDelay);
    }
    if (pathname === '/error') {
      return jsonResponse({ message: 'Fixture server error' }, 500);
    }
    if (pathname === '/events') return eventStreamResponse(fixtureSseChunks);

    if (pathname === '/chat/completions') {
      const body = (await request.json()) as {
        model?: string;
        stream?: boolean;
      };
      if (body.model === 'fixture-error') {
        return jsonResponse({ message: 'Fixture rate limit' }, 429);
      }
      if (body.model === 'fixture-cancel') {
        return eventStreamResponse([fixtureSseChunks[0]], false);
      }
      if (body.stream) return eventStreamResponse(fixtureSseChunks);
      return jsonResponse({
        id: 'chat-1',
        choices: [
          {
            index: 0,
            message: { role: 'assistant', content: 'Hello Fetcher' },
            finish_reason: 'stop',
          },
        ],
        usage: { prompt_tokens: 3, completion_tokens: 2, total_tokens: 5 },
      });
    }

    throw new Error(
      `Unexpected fixture request: ${request.method} ${url.href}`,
    );
  };

  return () => {
    globalThis.fetch = originalFetch;
  };
}

export function installFetchFixture(): () => void {
  return installFixture();
}

export function installDocumentationFetchFixture(): () => void {
  return installFixture(2000);
}
