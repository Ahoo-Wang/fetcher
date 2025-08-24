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
import {
  combineURLs,
  defaultFetcherName,
  Fetcher,
  fetcherRegistrar,
  FetcherRequest,
  NamedCapable,
} from '@ahoo-wang/fetcher';
import { ApiMetadata } from './apiDecorator';
import { EndpointMetadata } from './endpointDecorator';
import { ParameterMetadata, ParameterType } from './parameterDecorator';

export class FunctionMetadata implements NamedCapable {
  /**
   * Name of the function
   */
  name: string;
  api: ApiMetadata;
  endpoint: EndpointMetadata;
  parameters: ParameterMetadata[];

  constructor(
    name: string,
    api: ApiMetadata,
    endpoint: EndpointMetadata,
    parameters: ParameterMetadata[],
  ) {
    this.name = name;
    this.api = api;
    this.endpoint = endpoint;
    this.parameters = parameters;
  }

  get fetcher(): Fetcher {
    const fetcherName =
      this.endpoint.fetcher || this.api.fetcher || defaultFetcherName;
    return fetcherRegistrar.requiredGet(fetcherName);
  }

  resolveRequest(args: any[]): FetcherRequest {
    const pathParams: Record<string, any> = {};
    const queryParams: Record<string, any> = {};
    const headers: Record<string, string> = {
      ...this.api.headers,
      ...this.endpoint.headers,
    };
    let body: any = null;
    // Process parameters based on their decorators
    this.parameters.forEach(param => {
      const value = args[param.index];
      switch (param.type) {
        case ParameterType.PATH:
          if (param.name) {
            pathParams[param.name] = value;
          } else {
            // If no name specified, use as default path param
            pathParams['param' + param.index] = value;
          }
          break;
        case ParameterType.QUERY:
          if (param.name) {
            queryParams[param.name] = value;
          } else {
            queryParams['param' + param.index] = value;
          }
          break;
        case ParameterType.HEADER:
          if (param.name && value !== undefined) {
            headers[param.name] = String(value);
          }
          break;
        case ParameterType.BODY:
          body = value;
          break;
      }
    });
    return {
      pathParams,
      queryParams,
      headers,
      body,
      timeout: this.resolveTimeout(),
    };
  }

  resolvePath(): string {
    const basePath = this.endpoint.basePath || this.api.basePath || '';
    const endpointPath = this.endpoint.path || '';
    return combineURLs(basePath, endpointPath);
  }

  resolveTimeout(): number | undefined {
    return this.endpoint.timeout || this.api.timeout;
  }
}

export class RequestExecutor {
  private readonly metadata: FunctionMetadata;

  constructor(metadata: FunctionMetadata) {
    this.metadata = metadata;
  }

  async execute(args: any[]): Promise<Response> {
    const path = this.metadata.resolvePath();
    const request = this.metadata.resolveRequest(args);
    return await this.metadata.fetcher.fetch(path, request);
  }
}
