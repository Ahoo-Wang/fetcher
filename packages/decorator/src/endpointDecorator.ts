import { HttpMethod } from '@ahoo-wang/fetcher';
import { ApiMetadata } from './apiDecorator';
import 'reflect-metadata';

/**
 * Metadata for HTTP endpoints
 */
export interface EndpointMetadata extends ApiMetadata {
  /**
   * HTTP method for the endpoint
   */
  method: HttpMethod;

  /**
   * Path for the endpoint (relative to class base path)
   */
  path?: string;
}

export const ENDPOINT_METADATA_KEY = Symbol('endpoint:metadata');

export type MethodEndpointMetadata = Omit<EndpointMetadata, 'method' | 'path'>;

export function endpoint(method: HttpMethod, path?: string, metadata: MethodEndpointMetadata = {}) {
  return function(target: any, propertyKey: string): void {
    // Store metadata directly on the method
    const endpointMetadata = {
      method: method,
      path,
      ...metadata,
    };
    Reflect.defineMetadata(
      ENDPOINT_METADATA_KEY,
      endpointMetadata,
      target,
      propertyKey,
    );
  };
}


export function get(path?: string, metadata: MethodEndpointMetadata = {}) {
  return endpoint(HttpMethod.GET, path, metadata);
}

export function post(path?: string, metadata: MethodEndpointMetadata = {}) {
  return endpoint(HttpMethod.POST, path, metadata);
}

export function put(path?: string, metadata: MethodEndpointMetadata = {}) {
  return endpoint(HttpMethod.PUT, path, metadata);
}

export function del(path?: string, metadata: MethodEndpointMetadata = {}) {
  return endpoint(HttpMethod.DELETE, path, metadata);
}

export function patch(path?: string, metadata: MethodEndpointMetadata = {}) {
  return endpoint(HttpMethod.PATCH, path, metadata);
}

export function head(path?: string, metadata: MethodEndpointMetadata = {}) {
  return endpoint(HttpMethod.HEAD, path, metadata);
}

export function options(path?: string, metadata: MethodEndpointMetadata = {}) {
  return endpoint(HttpMethod.OPTIONS, path, metadata);
}