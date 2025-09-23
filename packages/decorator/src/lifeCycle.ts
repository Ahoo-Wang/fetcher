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

import { ApiMetadata } from './apiDecorator';

/**
 * Lifecycle interface for initialization hooks.
 * Implement this interface to add custom logic that should run during initialization.
 */
export interface OnInit {
  /**
   * Called during the initialization phase.
   * @param metadata - The API metadata associated with the initialization
   */
  onInit(metadata: ApiMetadata): void;
}