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

/**
 * A standard Response from another constructor, like the one an iframe's
 * `fetch`, a separately installed `undici` or a polyfill returns: it has the
 * standard members, but not the helpers this package installs on the global
 * `Response.prototype`.
 */
class ForeignResponse {
  readonly #response: Response;

  constructor(body?: BodyInit | null, init?: ResponseInit) {
    this.#response = new Response(body, init);
  }

  get headers() {
    return this.#response.headers;
  }

  get body() {
    return this.#response.body;
  }

  get bodyUsed() {
    return this.#response.bodyUsed;
  }

  get ok() {
    return this.#response.ok;
  }

  get status() {
    return this.#response.status;
  }

  get statusText() {
    return this.#response.statusText;
  }

  get url() {
    return this.#response.url;
  }

  json() {
    return this.#response.json();
  }

  text() {
    return this.#response.text();
  }
}

export function foreignResponse(
  body?: BodyInit | null,
  init?: ResponseInit,
): Response {
  const response = new ForeignResponse(body, init) as unknown as Response;
  if (response instanceof Response || 'requiredEventStream' in response) {
    throw new Error('Expected a Response without the prototype helpers');
  }
  return response;
}
