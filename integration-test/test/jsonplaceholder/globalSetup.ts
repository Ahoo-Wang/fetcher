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

import type { AddressInfo } from 'node:net';
import jsonServer from 'json-server';
import db from './db.json' with { type: 'json' };

export const JSONPLACEHOLDER_BASE_URL = 'JSONPLACEHOLDER_BASE_URL';

/**
 * Starts a local JSONPlaceholder for the `required` project, the way
 * JSONPlaceholder itself runs (typicode/jsonplaceholder): json-server 0.17
 * with `_isFake`, so POST/PUT/PATCH/DELETE answer like the live site (201 with
 * a new id, the merged or replaced resource, `{}`) without changing the data
 * other suites read. Nested routes (`/users/1/posts`) and filters
 * (`?userId=1`) come from json-server.
 *
 * It listens on a free port and publishes it as `JSONPLACEHOLDER_BASE_URL`,
 * which `typicodeFetcher` reads. When the variable is already set (for
 * example to https://jsonplaceholder.typicode.com in the advisory Integration
 * External workflow), no server starts and the suites run against that host.
 */
export default async function setup(): Promise<(() => Promise<void>) | void> {
  if (process.env[JSONPLACEHOLDER_BASE_URL]) {
    return;
  }
  const app = jsonServer.create();
  app.use(jsonServer.defaults({ logger: false }));
  // An in-memory copy: json-server only writes a file when given a path.
  app.use(jsonServer.router(structuredClone(db), { _isFake: true }));

  const server = await new Promise<ReturnType<typeof app.listen>>(
    (resolve, reject) => {
      const listening = app.listen(0, '127.0.0.1', () => resolve(listening));
      listening.once('error', reject);
    },
  );
  const { port } = server.address() as AddressInfo;
  process.env[JSONPLACEHOLDER_BASE_URL] = `http://127.0.0.1:${port}`;

  return () =>
    new Promise<void>((resolve, reject) =>
      server.close(error => (error ? reject(error) : resolve())),
    );
}
