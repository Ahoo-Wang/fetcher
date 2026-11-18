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

import { nanoid } from 'nanoid';

/** @deprecated `@ahoo-wang/fetcher-cosec` moved to `@ahoo-wang/cosec-fetcher` in the CoSec repository and is removed in the next fetcher major. See https://cosec.ahoo.me/integration/clients. */
export interface IdGenerator {
  generateId(): string;
}

/**
 * Nano ID implementation of IdGenerator.
 * Generates unique request IDs using Nano ID.
 *
 * @deprecated `@ahoo-wang/fetcher-cosec` moved to `@ahoo-wang/cosec-fetcher` in the CoSec repository and is removed in the next fetcher major. See https://cosec.ahoo.me/integration/clients.
 */
export class NanoIdGenerator implements IdGenerator {
  /**
   * Generate a unique request ID.
   *
   * @returns A unique request ID
   */
  generateId(): string {
    return nanoid();
  }
}

/** @deprecated `@ahoo-wang/fetcher-cosec` moved to `@ahoo-wang/cosec-fetcher` in the CoSec repository and is removed in the next fetcher major. See https://cosec.ahoo.me/integration/clients. */
export const idGenerator = new NanoIdGenerator();
