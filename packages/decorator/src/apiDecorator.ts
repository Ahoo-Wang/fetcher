import { HeadersCapable, TimeoutCapable } from '@ahoo-wang/fetcher';
import { ENDPOINT_METADATA_KEY } from './endpointDecorator';
import { RequestExecutor, FunctionMetadata } from './requestExecutor';
import { PARAMETER_METADATA_KEY } from './parameterDecorator';
import 'reflect-metadata';

/**
 * Metadata for class-level API configuration
 *
 */
export interface ApiMetadata extends TimeoutCapable, HeadersCapable {
  /**
   * Base path for all endpoints in the class
   */
  basePath?: string;

  /**
   * Default headers for all requests in the class
   */
  headers?: Record<string, string>;

  /**
   * Default timeout for all requests in the class
   */
  timeout?: number;

  /**
   * Name of the fetcher instance to use,default: default .
   * FetcherRegistrar
   */
  fetcher?: string;
}

export const API_METADATA_KEY = Symbol('api:metadata');

export function api(
  basePath: string = '',
  metadata: Omit<ApiMetadata, 'basePath'> = {},
) {
  return function(constructor: Function) {
    const apiMetadata: ApiMetadata = {
      basePath,
      ...metadata,
    };

    // Store metadata directly on the class constructor
    Reflect.defineMetadata(API_METADATA_KEY, apiMetadata, constructor);

    // Override prototype methods to implement actual HTTP calls
    Object.getOwnPropertyNames(constructor.prototype).forEach(methodName => {
      const method = constructor.prototype[methodName];
      if (methodName !== 'constructor' && typeof method === 'function') {
        const endpointMetadata = Reflect.getMetadata(
          ENDPOINT_METADATA_KEY,
          constructor.prototype,
          methodName,
        );

        if (endpointMetadata) {
          // Get parameter metadata for this method
          const parameterMetadata =
            Reflect.getMetadata(
              PARAMETER_METADATA_KEY,
              constructor.prototype,
              methodName,
            ) || [];

          // Create function metadata
          const functionMetadata = new FunctionMetadata(
            methodName,
            apiMetadata,
            endpointMetadata,
            parameterMetadata,
          );

          // Create request executor
          const requestExecutor = new RequestExecutor(functionMetadata);

          // Replace method with actual implementation
          constructor.prototype[methodName] = function(...args: any[]) {
            return requestExecutor.execute(args);
          };
        }
      }
    });
  };
}
