import { getParameterName } from './reflection';
import 'reflect-metadata';

/**
 * Parameter types for decorator parameters.
 *
 * Defines the different types of parameters that can be used
 * in API method decorators to specify how arguments should be handled
 * in the HTTP request.
 */
export enum ParameterType {
  /**
   * Path parameter that will be inserted into the URL path.
   *
   * Path parameters are used to specify dynamic parts of the URL path.
   * They are defined using curly braces in the endpoint path.
   *
   * @example
   * ```typescript
   * @get('/users/{id}')
   * getUser(@path('id') userId: string): Promise<Response>
   * ```
   */
  PATH = 'path',

  /**
   * Query parameter that will be appended to the URL query string.
   *
   * Query parameters are used to pass non-hierarchical data to the server.
   * They appear after the '?' in the URL.
   *
   * @example
   * ```typescript
   * @get('/users')
   * getUsers(@query('limit') limit: number): Promise<Response>
   * ```
   */
  QUERY = 'query',

  /**
   * Header parameter that will be added to the request headers.
   *
   * Header parameters are used to pass metadata about the request,
   * such as authentication tokens or content type information.
   *
   * @example
   * ```typescript
   * @get('/users')
   * getUsers(@header('Authorization') token: string): Promise<Response>
   * ```
   */
  HEADER = 'header',

  /**
   * Body parameter that will be sent as the request body.
   *
   * The body parameter represents the main data payload of the request.
   * It is typically used with POST, PUT, and PATCH requests.
   *
   * @example
   * ```typescript
   * @post('/users')
   * createUser(@body() user: User): Promise<Response>
   * ```
   */
  BODY = 'body',

  /**
   * Request parameter that will be used as the request object.
   */
  REQUEST = 'request',
}

/**
 * Metadata for method parameters.
 *
 * Defines the metadata stored for each parameter
 * decorated with @path, @query, @header, or @body decorators.
 */
export interface ParameterMetadata {
  /**
   * Type of parameter (path, query, header, body).
   *
   * Specifies how this parameter should be handled in the HTTP request.
   */
  type: ParameterType;

  /**
   * Name of the parameter (used for path, query, and header parameters).
   *
   * For path and query parameters, this corresponds to the key in the URL.
   * For header parameters, this corresponds to the header name.
   * For body parameters, this is not used.
   */
  name?: string;

  /**
   * Index of the parameter in the method signature.
   *
   * This is used to map the runtime argument values to the correct parameter metadata.
   */
  index: number;
}

export const PARAMETER_METADATA_KEY = Symbol('parameter:metadata');

/**
 * Decorator factory for method parameters.
 *
 * Creates a decorator that can be used to specify how a method parameter
 * should be handled in the HTTP request. It stores metadata about the parameter
 * that will be used during request execution.
 * The name is optional - if not provided, it will be automatically extracted
 * from the method parameter name using reflection.
 *
 * @param type - The type of parameter (PATH, QUERY, HEADER, or BODY)
 * @param name - The name of the parameter (used for path, query, and header parameters, optional - auto-extracted if not provided)
 * @returns A parameter decorator function
 *
 * @example
 * ```typescript
 * // With explicit name
 * @get('/users/{id}')
 * getUser(@parameter(ParameterType.PATH, 'id') userId: string): Promise<Response>
 *
 * // With auto-extracted name
 * @get('/users/{userId}')
 * getUser(@parameter(ParameterType.PATH) userId: string): Promise<Response>
 * ```
 */
export function parameter(type: ParameterType, name: string = '') {
  return function(
    target: object,
    propertyKey: string | symbol,
    parameterIndex: number,
  ) {
    const paramName = getParameterName(
      target,
      propertyKey as string,
      parameterIndex,
      name,
    );

    const existingParameters: Map<number, ParameterMetadata> =
      Reflect.getMetadata(PARAMETER_METADATA_KEY, target, propertyKey) ||
      new Map();
    const parameterMetadata: ParameterMetadata = {
      type: type,
      name: paramName,
      index: parameterIndex,
    };
    existingParameters.set(parameterIndex, parameterMetadata);
    Reflect.defineMetadata(
      PARAMETER_METADATA_KEY,
      existingParameters,
      target,
      propertyKey,
    );
  };
}

/**
 * Path parameter decorator.
 *
 * Defines a path parameter that will be inserted into the URL path.
 * The name is optional - if not provided, it will be automatically extracted
 * from the method parameter name using reflection.
 *
 * @param name - The name of the path parameter (optional, auto-extracted if not provided)
 * @returns A parameter decorator function
 *
 * @example
 * ```typescript
 * // With explicit name
 * @get('/users/{id}')
 * getUser(@path('id') userId: string): Promise<Response>
 *
 * // With auto-extracted name
 * @get('/users/{userId}')
 * getUser(@path() userId: string): Promise<Response>
 * ```
 */
export function path(name: string = '') {
  return parameter(ParameterType.PATH, name);
}

/**
 * Query parameter decorator.
 *
 * Defines a query parameter that will be appended to the URL query string.
 * The name is optional - if not provided, it will be automatically extracted
 * from the method parameter name using reflection.
 *
 * @param name - The name of the query parameter (optional, auto-extracted if not provided)
 * @returns A parameter decorator function
 *
 * @example
 * ```typescript
 * // With explicit name
 * @get('/users')
 * getUsers(@query('limit') limit: number): Promise<Response>
 *
 * // With auto-extracted name
 * @get('/users')
 * getUsers(@query() limit: number): Promise<Response>
 * ```
 */
export function query(name: string = '') {
  return parameter(ParameterType.QUERY, name);
}

/**
 * Header parameter decorator.
 *
 * Defines a header parameter that will be added to the request headers.
 * The name is optional - if not provided, it will be automatically extracted
 * from the method parameter name using reflection.
 *
 * @param name - The name of the header parameter (optional, auto-extracted if not provided)
 * @returns A parameter decorator function
 *
 * @example
 * ```typescript
 * // With explicit name
 * @get('/users')
 * getUsers(@header('Authorization') token: string): Promise<Response>
 *
 * // With auto-extracted name
 * @get('/users')
 * getUsers(@header() authorization: string): Promise<Response>
 * ```
 */
export function header(name: string = '') {
  return parameter(ParameterType.HEADER, name);
}

/**
 * Body parameter decorator.
 *
 * Defines a body parameter that will be sent as the request body.
 * Note that body parameters don't have names since there's only one body per request.
 *
 * @returns A parameter decorator function
 *
 * @example
 * ```typescript
 * @post('/users')
 * createUser(@body() user: User): Promise<Response>
 * ```
 */
export function body() {
  return parameter(ParameterType.BODY);
}

/**
 * Request parameter decorator.
 *
 * Defines a request parameter that will be used as the base request object.
 * This allows you to pass a complete FetcherRequest object to customize
 * the request configuration.
 *
 * @returns A parameter decorator function
 *
 * @example
 * ```typescript
 * @post('/users')
 * createUsers(@request() request: FetcherRequest): Promise<Response>
 * ```
 */
export function request() {
  return parameter(ParameterType.REQUEST);
}
