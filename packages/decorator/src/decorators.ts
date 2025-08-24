import {
  ApiMetadata,
  EndpointMetadata,
  ParameterMetadata,
  ParameterType,
  API_METADATA_KEY,
  ENDPOINT_METADATA_KEY,
  PARAMETER_METADATA_KEY,
} from './metadata';
import { HttpMethod } from '@ahoo-wang/fetcher';
import { fetcherRegistrar } from '@ahoo-wang/fetcher';
import 'reflect-metadata';

/**
 * Class decorator for defining API metadata
 * @param basePath Base path for all endpoints in the class
 * @param metadata Additional API metadata
 */
export function api(
  basePath: string = '',
  metadata: Partial<ApiMetadata> = {},
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
          // Replace the method with an implementation that makes the actual HTTP call
          constructor.prototype[methodName] = function(...args: any[]) {
            return executeRequest(constructor, methodName, args);
          };
        }
      }
    });
  };
}

/**
 * HTTP method decorators
 */
export function get(path?: string, metadata: Partial<EndpointMetadata> = {}) {
  return function(
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const endpointMetadata: EndpointMetadata = {
      method: HttpMethod.GET,
      path,
      ...metadata,
    };

    // Store metadata directly on the method
    Reflect.defineMetadata(
      ENDPOINT_METADATA_KEY,
      endpointMetadata,
      target,
      propertyKey,
    );

    return descriptor;
  };
}

export function post(path?: string, metadata: Partial<EndpointMetadata> = {}) {
  return function(
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const endpointMetadata: EndpointMetadata = {
      method: HttpMethod.POST,
      path,
      ...metadata,
    };

    // Store metadata directly on the method
    Reflect.defineMetadata(
      ENDPOINT_METADATA_KEY,
      endpointMetadata,
      target,
      propertyKey,
    );

    return descriptor;
  };
}

export function put(path?: string, metadata: Partial<EndpointMetadata> = {}) {
  return function(
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const endpointMetadata: EndpointMetadata = {
      method: HttpMethod.PUT,
      path,
      ...metadata,
    };

    // Store metadata directly on the method
    Reflect.defineMetadata(
      ENDPOINT_METADATA_KEY,
      endpointMetadata,
      target,
      propertyKey,
    );

    return descriptor;
  };
}

export function del(path?: string, metadata: Partial<EndpointMetadata> = {}) {
  return function(
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const endpointMetadata: EndpointMetadata = {
      method: HttpMethod.DELETE,
      path,
      ...metadata,
    };

    // Store metadata directly on the method
    Reflect.defineMetadata(
      ENDPOINT_METADATA_KEY,
      endpointMetadata,
      target,
      propertyKey,
    );

    return descriptor;
  };
}

export function patch(path?: string, metadata: Partial<EndpointMetadata> = {}) {
  return function(
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const endpointMetadata: EndpointMetadata = {
      method: HttpMethod.PATCH,
      path,
      ...metadata,
    };

    // Store metadata directly on the method
    Reflect.defineMetadata(
      ENDPOINT_METADATA_KEY,
      endpointMetadata,
      target,
      propertyKey,
    );

    return descriptor;
  };
}

export function head(path?: string, metadata: Partial<EndpointMetadata> = {}) {
  return function(
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const endpointMetadata: EndpointMetadata = {
      method: HttpMethod.HEAD,
      path,
      ...metadata,
    };

    // Store metadata directly on the method
    Reflect.defineMetadata(
      ENDPOINT_METADATA_KEY,
      endpointMetadata,
      target,
      propertyKey,
    );

    return descriptor;
  };
}

export function options(
  path?: string,
  metadata: Partial<EndpointMetadata> = {},
) {
  return function(
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const endpointMetadata: EndpointMetadata = {
      method: HttpMethod.OPTIONS,
      path,
      ...metadata,
    };

    // Store metadata directly on the method
    Reflect.defineMetadata(
      ENDPOINT_METADATA_KEY,
      endpointMetadata,
      target,
      propertyKey,
    );

    return descriptor;
  };
}

/**
 * Parameter decorators
 */
export function path(name?: string) {
  return function(target: any, propertyKey: string, parameterIndex: number) {
    const existingParameters: ParameterMetadata[] =
      Reflect.getMetadata(PARAMETER_METADATA_KEY, target, propertyKey) || [];

    existingParameters.push({
      type: ParameterType.PATH,
      name,
      index: parameterIndex,
    });

    Reflect.defineMetadata(
      PARAMETER_METADATA_KEY,
      existingParameters,
      target,
      propertyKey,
    );
  };
}

export function query(name?: string) {
  return function(target: any, propertyKey: string, parameterIndex: number) {
    const existingParameters: ParameterMetadata[] =
      Reflect.getMetadata(PARAMETER_METADATA_KEY, target, propertyKey) || [];

    existingParameters.push({
      type: ParameterType.QUERY,
      name,
      index: parameterIndex,
    });

    Reflect.defineMetadata(
      PARAMETER_METADATA_KEY,
      existingParameters,
      target,
      propertyKey,
    );
  };
}

export function body() {
  return function(target: any, propertyKey: string, parameterIndex: number) {
    const existingParameters: ParameterMetadata[] =
      Reflect.getMetadata(PARAMETER_METADATA_KEY, target, propertyKey) || [];

    existingParameters.push({
      type: ParameterType.BODY,
      index: parameterIndex,
    });

    Reflect.defineMetadata(
      PARAMETER_METADATA_KEY,
      existingParameters,
      target,
      propertyKey,
    );
  };
}

export function header(name?: string) {
  return function(target: any, propertyKey: string, parameterIndex: number) {
    const existingParameters: ParameterMetadata[] =
      Reflect.getMetadata(PARAMETER_METADATA_KEY, target, propertyKey) || [];

    existingParameters.push({
      type: ParameterType.HEADER,
      name,
      index: parameterIndex,
    });

    Reflect.defineMetadata(
      PARAMETER_METADATA_KEY,
      existingParameters,
      target,
      propertyKey,
    );
  };
}

// Helper functions

async function executeRequest(
  constructor: Function,
  methodName: string,
  args: any[],
): Promise<Response> {
  // Get class-level metadata
  const classMetadata: ApiMetadata =
    Reflect.getMetadata(API_METADATA_KEY, constructor) || {};

  // Get method-level metadata
  const endpointMetadata: EndpointMetadata = Reflect.getMetadata(
    ENDPOINT_METADATA_KEY,
    constructor.prototype,
    methodName,
  );

  if (!endpointMetadata) {
    throw new Error(`No endpoint metadata found for method ${methodName}`);
  }

  // Get parameter metadata
  const parameterMetadata: ParameterMetadata[] =
    Reflect.getMetadata(
      PARAMETER_METADATA_KEY,
      constructor.prototype,
      methodName,
    ) || [];

  // Build request configuration
  const pathParams: Record<string, any> = {};
  const queryParams: Record<string, any> = {};
  const headers: Record<string, string> = {};
  let body: any = null;

  // Process parameters based on their decorators
  parameterMetadata.forEach(param => {
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

  // Resolve fetcher
  const fetcherName =
    endpointMetadata.fetcher || classMetadata.fetcher || 'default';
  const fetcher = fetcherRegistrar.requiredGet(fetcherName);

  // Build URL
  let url = endpointMetadata.path || '';
  if (classMetadata.basePath) {
    // Combine class base path with method path
    const basePath = classMetadata.basePath.replace(/\/$/, ''); // Remove trailing slash
    url = basePath + (url.startsWith('/') ? url : '/' + url);
  }

  // Merge headers
  const mergedHeaders = {
    ...(classMetadata.headers || {}),
    ...(endpointMetadata.headers || {}),
    ...headers,
  };

  // Resolve timeout
  const timeout =
    endpointMetadata.timeout || classMetadata.timeout || fetcher.timeout;

  // Make the actual request
  try {
    const response = await fetcher.fetch(url, {
      method: endpointMetadata.method,
      headers:
        Object.keys(mergedHeaders).length > 0 ? mergedHeaders : undefined,
      pathParams: Object.keys(pathParams).length > 0 ? pathParams : undefined,
      queryParams:
        Object.keys(queryParams).length > 0 ? queryParams : undefined,
      body: body !== null ? body : undefined,
      timeout,
    });

    return response;
  } catch (error) {
    throw error;
  }
}
