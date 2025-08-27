import { UrlResolveInterceptor } from './urlResolveInterceptor';
import { RequestBodyInterceptor } from './requestBodyInterceptor';
import { FetchInterceptor } from './fetchInterceptor';
import { FetchExchange } from './fetchExchange';
import { FetcherError } from './fetcherError';
import { InterceptorRegistry } from './interceptor';
import { ValidateStatusInterceptor } from './validateStatusInterceptor';

/**
 * Custom error class for FetchExchange related errors.
 *
 * This error is thrown when there are issues with the HTTP exchange process,
 * such as when a request fails and no response is generated. It provides
 * comprehensive information about the failed request through the exchange object.
 *
 * @example
 * ```typescript
 * try {
 *   await fetcher.get('/api/users');
 * } catch (error) {
 *   if (error instanceof ExchangeError) {
 *     console.log('Request URL:', error.exchange.request.url);
 *     console.log('Request method:', error.exchange.request.method);
 *     if (error.exchange.error) {
 *       console.log('Underlying error:', error.exchange.error);
 *     }
 *   }
 * }
 * ```
 */
export class ExchangeError extends FetcherError {
  /**
   * Creates a new ExchangeError instance.
   *
   * @param exchange - The FetchExchange object containing request/response/error information.
   */
  constructor(public readonly exchange: FetchExchange) {
    const errorMessage =
      exchange.error?.message ||
      exchange.response?.statusText ||
      `Request to ${exchange.request.url} failed during exchange`;
    super(errorMessage, exchange.error);
    this.name = 'ExchangeError';
    Object.setPrototypeOf(this, ExchangeError.prototype);
  }
}

/**
 * Collection of interceptor managers for the Fetcher client.
 *
 * Manages three types of interceptors:
 * 1. Request interceptors - Process requests before sending HTTP requests
 * 2. Response interceptors - Process responses after receiving HTTP responses
 * 3. Error interceptors - Handle errors when they occur during the request process
 *
 * Each type of interceptor is managed by an InterceptorRegistry instance, supporting
 * adding, removing, and executing interceptors.
 *
 * @example
 * // Create a custom interceptor
 * const customRequestInterceptor: Interceptor = {
 *   name: 'CustomRequestInterceptor',
 *   order: 100,
 *   async intercept(exchange: FetchExchange): Promise<FetchExchange> {
 *     // Modify request headers
 *     exchange.request.headers = {
 *       ...exchange.request.headers,
 *       'X-Custom-Header': 'custom-value'
 *     };
 *     return exchange;
 *   }
 * };
 *
 * // Add interceptor to Fetcher
 * const fetcher = new Fetcher();
 * fetcher.interceptors.request.use(customRequestInterceptor);
 *
 * @remarks
 * By default, the request interceptor registry has three built-in interceptors registered:
 * 1. UrlResolveInterceptor - Resolves the final URL with parameters
 * 2. RequestBodyInterceptor - Automatically converts object-type request bodies to JSON strings
 * 3. FetchInterceptor - Executes actual HTTP requests and handles timeouts
 */
export class InterceptorManager {
  /**
   * Registry for request-phase interceptors.
   *
   * Executed before HTTP requests are sent. Contains three built-in interceptors by default:
   * UrlResolveInterceptor, RequestBodyInterceptor, and FetchInterceptor.
   *
   * @remarks
   * Request interceptors are executed in ascending order of their order values, with smaller
   * values having higher priority. The default interceptors are:
   * 1. UrlResolveInterceptor (order: Number.MIN_SAFE_INTEGER) - Resolves the final URL
   * 2. RequestBodyInterceptor (order: 0) - Converts object bodies to JSON
   * 3. FetchInterceptor (order: Number.MAX_SAFE_INTEGER) - Executes the actual HTTP request
   */
  request: InterceptorRegistry = new InterceptorRegistry([
    new UrlResolveInterceptor(),
    new RequestBodyInterceptor(),
    new FetchInterceptor(),
  ]);

  /**
   * Manager for response-phase interceptors.
   *
   * Executed after HTTP responses are received. Contains ValidateStatusInterceptor by default
   * which validates HTTP status codes and throws errors for invalid statuses.
   *
   * @remarks
   * Response interceptors are executed in ascending order of their order values, with smaller
   * values having higher priority.
   *
   * By default, the response interceptor registry has one built-in interceptor registered:
   * 1. ValidateStatusInterceptor - Validates HTTP status codes and throws HttpStatusValidationError for invalid statuses
   */
  response: InterceptorRegistry = new InterceptorRegistry([
    new ValidateStatusInterceptor(),
  ]);

  /**
   * Manager for error-handling phase interceptors.
   *
   * Executed when errors occur during HTTP requests. Empty by default, custom error handling
   * logic can be added as needed.
   *
   * @remarks
   * Error interceptors are executed in ascending order of their order values, with smaller
   * values having higher priority. Error interceptors can transform errors into normal responses,
   * avoiding thrown exceptions.
   */
  error: InterceptorRegistry = new InterceptorRegistry();

  /**
   * Processes a FetchExchange through the interceptor pipeline.
   *
   * This method is the core of the Fetcher's interceptor system. It executes the three
   * phases of interceptors in sequence:
   * 1. Request interceptors - Process the request before sending
   * 2. Response interceptors - Process the response after receiving
   * 3. Error interceptors - Handle any errors that occurred during the process
   *
   * The interceptor pipeline follows the Chain of Responsibility pattern, where each
   * interceptor can modify the exchange object and decide whether to continue or
   * terminate the chain.
   *
   * @param fetchExchange - The exchange object containing request, response, and error information
   * @returns Promise that resolves to the processed FetchExchange
   * @throws ExchangeError if an unhandled error occurs during processing
   *
   * @remarks
   * The method handles three distinct phases:
   *
   * 1. Request Phase: Executes request interceptors which can modify headers, URL, body, etc.
   *    Built-in interceptors handle URL resolution, body serialization, and actual HTTP execution.
   *
   * 2. Response Phase: Executes response interceptors which can transform or validate responses.
   *    These interceptors only run if the request phase completed without throwing.
   *
   * 3. Error Phase: Executes error interceptors when any phase throws an error. Error interceptors
   *    can handle errors by clearing the error property. If error interceptors clear the error,
   *    the exchange is returned successfully.
   *
   * Error Handling:
   * - If any interceptor throws an error, the error phase is triggered
   * - Error interceptors can "fix" errors by clearing the error property on the exchange
   * - If errors remain after error interceptors run, they are wrapped in ExchangeError
   *
   * Order of Execution:
   * 1. Request interceptors (sorted by order property, ascending)
   * 2. Response interceptors (sorted by order property, ascending) - only if no error in request phase
   * 3. Error interceptors (sorted by order property, ascending) - only if an error occurred
   *
   * @example
   * ```typescript
   * // Create a fetcher with custom interceptors
   * const fetcher = new Fetcher();
   *
   * // Add a request interceptor
   * fetcher.interceptors.request.use({
   *   name: 'AuthInterceptor',
   *   order: 100,
   *   async intercept(exchange: FetchExchange) {
   *     exchange.request.headers = {
   *       ...exchange.request.headers,
   *       'Authorization': 'Bearer ' + getToken()
   *     };
   *   }
   * });
   *
   * // Add a response interceptor
   * fetcher.interceptors.response.use({
   *   name: 'ResponseLogger',
   *   order: 100,
   *   async intercept(exchange: FetchExchange) {
   *     console.log(`Response status: ${exchange.response?.status}`);
   *   }
   * });
   *
   * // Add an error interceptor
   * fetcher.interceptors.error.use({
   *   name: 'ErrorLogger',
   *   order: 100,
   *   async intercept(exchange: FetchExchange) {
   *     console.error(`Request to ${exchange.request.url} failed:`, exchange.error);
   *     // Clear the error to indicate it's been handled
   *     exchange.error = undefined;
   *   }
   * });
   *
   * // Create and process an exchange
   * const request: FetchRequest = {
   *   url: '/api/users',
   *   method: HttpMethod.GET
   * };
   * const exchange = new FetchExchange(fetcher, request);
   * const result = await fetcher.exchange(exchange);
   * ```
   */
  async exchange(fetchExchange: FetchExchange): Promise<FetchExchange> {
    try {
      // Apply request interceptors
      await this.request.intercept(fetchExchange);
      // Apply response interceptors
      await this.response.intercept(fetchExchange);
      return fetchExchange;
    } catch (error: any) {
      // Apply error interceptors
      fetchExchange.error = error;
      await this.error.intercept(fetchExchange);

      // If error interceptors cleared the error (indicating it's been handled/fixed), return the exchange
      if (!fetchExchange.hasError()) {
        return fetchExchange;
      }

      // Otherwise, wrap the error in ExchangeError
      throw new ExchangeError(fetchExchange);
    }
  }
}
