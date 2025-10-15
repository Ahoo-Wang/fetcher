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

import { ChatClient } from './chat';
import { BaseURLCapable, Fetcher } from '@ahoo-wang/fetcher';

/**
 * Configuration options for the OpenAI client.
 *
 * This interface defines the required settings to initialize an OpenAI client instance,
 * including the API endpoint and authentication credentials.
 */
export interface OpenAIOptions extends BaseURLCapable {
  /**
   * The base URL for the OpenAI API.
   *
   * This should be the root URL of the OpenAI API service (e.g., 'https://api.openai.com/v1').
   * It is used as the base for all API requests made by the client.
   */
  baseURL: string;

  /**
   * The API key for authenticating requests to the OpenAI API.
   *
   * This key must be a valid OpenAI API key obtained from the OpenAI platform.
   * It is included in the Authorization header as a Bearer token for all requests.
   */
  apiKey: string;
}

/**
 * OpenAI client class for interacting with the OpenAI API.
 *
 * This class provides a high-level interface to the OpenAI API, encapsulating HTTP client
 * functionality and specialized clients for different API features. It serves as the main entry
 * point for applications needing to integrate with OpenAI services.
 *
 * @example
 * ```typescript
 * const client = new OpenAI({
 *   baseURL: 'https://api.openai.com/v1',
 *   apiKey: 'your-api-key-here'
 * });
 *
 * // Use the chat client for completions
 * const response = await client.chat.completions.create({
 *   model: 'gpt-3.5-turbo',
 *   messages: [{ role: 'user', content: 'Hello!' }]
 * });
 * ```
 */
export class OpenAI {
  /**
   * HTTP client instance for making requests to the OpenAI API.
   *
   * This Fetcher instance is configured with the base URL and authentication headers
   * provided during initialization. It handles all underlying HTTP communication.
   */
  public readonly fetcher: Fetcher;

  /**
   * Chat completion client for interacting with OpenAI's chat models.
   *
   * Provides methods to create chat completions, manage conversations, and handle
   * streaming responses from chat-based models like GPT-3.5 and GPT-4.
   */
  public readonly chat: ChatClient;

  /**
   * Creates an instance of the OpenAI client.
   *
   * Initializes the client with the provided configuration options, setting up the
   * HTTP client with proper authentication and creating specialized sub-clients
   * for different API features.
   *
   * @param options - Configuration options for the OpenAI client.
   * @throws {Error} If the provided options are invalid or missing required fields.
   * @throws {TypeError} If the apiKey or baseURL are not strings.
   *
   * @example
   * ```typescript
   * const openai = new OpenAI({
   *   baseURL: 'https://api.openai.com/v1',
   *   apiKey: process.env.OPENAI_API_KEY!
   * });
   * ```
   */
  constructor(options: OpenAIOptions) {
    this.fetcher = new Fetcher({
      baseURL: options.baseURL,
      headers: {
        Authorization: `Bearer ${options.apiKey}`,
      },
    });
    this.chat = new ChatClient({ fetcher: this.fetcher });
  }
}
