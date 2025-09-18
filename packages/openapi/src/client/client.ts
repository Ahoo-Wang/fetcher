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


import { HTTPMethod, OpenAPI, OperationHandler } from '../index';
import { Fetcher, FetchRequest, FetchRequestInit, RequestOptions } from '@ahoo-wang/fetcher';

/**
 * Configuration type for API clients based on OpenAPI specification
 */
export type OpenAPIClientOptions<T extends OpenAPI> = {
  baseURL?: string;
  fetcher: Fetcher
} & {
  [K in keyof T['paths']]: {
    [M in HTTPMethod]?: M extends keyof T['paths'][K]
      ? OperationHandler<T, K, M>
      : never;
  };
};

/**
 * Creates a type-safe OpenAPI client based on the provided OpenAPI specification
 * @param spec - The OpenAPI specification to base the client on
 * @param clientOptions - Configuration options including the fetcher instance
 * @returns An object with a request method for making API calls
 */
// export function createOpenAPIClient<T extends OpenAPI>(spec: T, clientOptions: OpenAPIClientOptions<T>) {
//   return {
//     /**
//      * Makes a request to the API using the OpenAPI specification for type safety
//      * @param path - The API path to request, must be defined in the OpenAPI specification
//      * @param method - The HTTP method to use, must be valid for the given path
//      * @param request - Request configuration excluding the URL
//      * @param options - Additional request options
//      * @returns A promise that resolves to the API response
//      */
//     request: async <Path extends keyof T['paths'], Method extends HTTPMethod>(
//       path: Path,
//       method: Method,
//       request: Omit<FetchRequestInit, 'url'> = {},
//       options?: RequestOptions,
//     ) => {
//       // Validate that the path exists in the specification
//       if (!spec.paths[path]) {
//         throw new Error(`Path '${String(path)}' is not defined in the OpenAPI specification`);
//       }
//
//       // Validate that the method exists for this path
//       if (!spec.paths[path][method]) {
//         throw new Error(`Method '${method}' is not defined for path '${String(path)}' in the OpenAPI specification`);
//       }
//
//       const mergedRequest: FetchRequest = {
//         ...request,
//         method: method as string,
//         url: path as string,
//       };
//       return clientOptions.fetcher.request(mergedRequest, options);
//     },
//   };
// }

export function createOpenAPIClient<T extends OpenAPI>(spec: T, config: OpenAPIClientOptions<T>) {
  return {
    request: async <Path extends keyof T['paths'], Method extends HTTPMethod>(
      path: Path,
      method: Method,
      params: any,
    ) => {
      // 实际请求逻辑
      console.log(`Making ${method} request to ${path as string}`);
      // 返回模拟数据
      return { status: 200, data: { id: 123, name: 'John Doe' } };
    },
  };
}