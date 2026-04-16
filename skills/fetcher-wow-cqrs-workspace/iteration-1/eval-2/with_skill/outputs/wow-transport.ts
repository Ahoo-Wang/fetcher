/*
 * WowTransport - Fetcher-based Transport for Wow CQRS Backend
 *
 * This module provides a comprehensive WowTransport implementation that uses the
 * fetcher HTTP client to communicate with a Wow CQRS backend. It supports both
 * command and query operations with full type safety.
 *
 * Backend URL: https://api.example.com/wow
 */

import {
  Fetcher,
  type FetcherOptions,
  type FetchRequestInit,
  type FetchRequest,
  ContentTypeValues,
  HttpMethod,
  type RequestHeaders,
} from '@ahoo-wang/fetcher';
import type {
  CommandRequest,
  CommandResult,
  CommandResultEventStream,
} from '@ahoo-wang/fetcher-wow';
import {
  CommandHeaders,
  CommandStage,
  QueryClientFactory,
  SnapshotQueryClient,
  EventStreamQueryClient,
  LoadStateAggregateClient,
  LoadOwnerStateAggregateClient,
  createQueryApiMetadata,
  type QueryClientOptions,
} from '@ahoo-wang/fetcher-wow';

// =============================================================================
// Response Types
// =============================================================================

/**
 * Response wrapper for Wow command operations.
 *
 * Provides a consistent interface for handling command execution results
 * including success/error state and typed data payloads.
 *
 * @template T - The type of the command result data
 */
export interface WowCommandResponse<T = CommandResult> {
  /** The command result data */
  data: T;
  /** Whether the command was successful */
  success: boolean;
  /** HTTP status code if available */
  statusCode?: number;
  /** Error information if the command failed */
  error?: WowErrorInfo;
}

/**
 * Response wrapper for Wow query operations.
 *
 * Provides a consistent interface for handling query results
 * with proper type safety for the returned data.
 *
 * @template T - The type of the query result data
 */
export interface WowQueryResponse<T = any> {
  /** The query result data */
  data: T;
  /** Whether the query was successful */
  success: boolean;
  /** HTTP status code if available */
  statusCode?: number;
  /** Error information if the query failed */
  error?: WowErrorInfo;
}

/**
 * Standardized error information structure for Wow operations.
 */
export interface WowErrorInfo {
  /** Error code for programmatic handling */
  code: string;
  /** Human-readable error message */
  message: string;
  /** Additional error details */
  details?: any;
  /** Stack trace or additional context */
  stack?: string;
}

// =============================================================================
// Transport Options
// =============================================================================

/**
 * Configuration options for WowTransport.
 *
 * All options are optional with sensible defaults for development
 * and testing environments.
 */
export interface WowTransportOptions {
  /**
   * The base URL of the Wow CQRS backend.
   * Commands and queries will be sent relative to this URL.
   * @default 'https://api.example.com/wow'
   */
  baseURL?: string;

  /**
   * Default timeout for requests in milliseconds.
   * Can be overridden per-request.
   * @default 30000 (30 seconds)
   */
  timeout?: number;

  /**
   * Default headers to include in all requests.
   */
  headers?: RequestHeaders;

  /**
   * The Fetcher instance to use.
   * If not provided, a new Fetcher will be created.
   * Useful when you need custom interceptors.
   */
  fetcher?: Fetcher;

  /**
   * Tenant identifier for multi-tenant setups.
   * Will be included in Command-Tenant-Id header.
   */
  tenantId?: string;

  /**
   * Owner identifier for owner-based resource attribution.
   * Will be included in Command-Owner-Id header.
   */
  ownerId?: string;

  /**
   * Space identifier for namespace isolation.
   * Will be included in Command-Space-Id header.
   */
  spaceId?: string;

  /**
   * Default command stage to wait for.
   * @default CommandStage.SNAPSHOT
   */
  defaultWaitStage?: CommandStage;

  /**
   * Default wait timeout in milliseconds.
   * @default 30000
   */
  defaultWaitTimeout?: number;
}

// =============================================================================
// WowTransport Implementation
// =============================================================================

/**
 * WowTransport - A fetcher-based transport for Wow CQRS operations
 *
 * This transport provides a typed interface for sending commands and queries
 * to a Wow CQRS backend. It wraps the fetcher HTTP client with Wow-specific
 * semantics including command staging, result extraction, and consistent
 * error handling.
 *
 * @example
 * ```typescript
 * // Basic usage
 * const transport = new WowTransport({
 *   baseURL: 'https://api.example.com/wow',
 *   tenantId: 'tenant-123',
 * });
 *
 * // Send a command
 * const result = await transport.sendCommand('add_cart_item', {
 *   productId: 'product-1',
 *   quantity: 2,
 * });
 *
 * // Query aggregate state
 * const state = await transport.queryState('cart', 'cart-123');
 * ```
 *
 * @example
 * ```typescript
 * // With existing Fetcher (for custom interceptors)
 * const customFetcher = new Fetcher({
 *   baseURL: 'https://api.example.com',
 *   interceptors: myCustomInterceptors,
 * });
 *
 * const transport = new WowTransport({
 *   baseURL: 'https://api.example.com/wow',
 *   fetcher: customFetcher,
 * });
 * ```
 */
export class WowTransport {
  private readonly fetcher: Fetcher;
  private readonly baseURL: string;
  private readonly tenantId?: string;
  private readonly ownerId?: string;
  private readonly spaceId?: string;
  private readonly defaultWaitStage: CommandStage;
  private readonly defaultWaitTimeout: number;

  /**
   * Creates a new WowTransport instance.
   *
   * @param options - Configuration options for the transport
   */
  constructor(options: WowTransportOptions = {}) {
    this.baseURL = options.baseURL ?? 'https://api.example.com/wow';
    this.tenantId = options.tenantId;
    this.ownerId = options.ownerId;
    this.spaceId = options.spaceId;
    this.defaultWaitStage = options.defaultWaitStage ?? CommandStage.SNAPSHOT;
    this.defaultWaitTimeout = options.defaultWaitTimeout ?? 30000;

    if (options.fetcher) {
      this.fetcher = options.fetcher;
    } else {
      const fetcherOptions: FetcherOptions = {
        baseURL: this.baseURL,
        timeout: options.timeout,
        headers: {
          'Content-Type': ContentTypeValues.APPLICATION_JSON,
          ...options.headers,
        },
      };
      this.fetcher = new Fetcher(fetcherOptions);
    }
  }

  // ===========================================================================
  // Accessors
  // ===========================================================================

  /**
   * Gets the underlying Fetcher instance.
   *
   * This allows direct access to the fetcher for custom operations
   * that are not covered by the transport's high-level API, such as
   * adding custom interceptors or making raw requests.
   */
  getFetcher(): Fetcher {
    return this.fetcher;
  }

  /**
   * Gets the configured base URL.
   */
  getBaseURL(): string {
    return this.baseURL;
  }

  /**
   * Gets the configured tenant ID.
   */
  getTenantId(): string | undefined {
    return this.tenantId;
  }

  /**
   * Gets the configured owner ID.
   */
  getOwnerId(): string | undefined {
    return this.ownerId;
  }

  // ===========================================================================
  // Header Building
  // ===========================================================================

  /**
   * Builds command request headers with Wow-specific headers.
   *
   * Combines transport-level defaults with request-specific overrides
   * to produce complete command headers for Wow API requests.
   *
   * @param options - Optional header overrides
   * @returns Complete command headers
   */
  private buildCommandHeaders(options?: {
    aggregateId?: string;
    aggregateVersion?: number;
    waitStage?: CommandStage;
    waitTimeout?: number;
    customHeaders?: RequestHeaders;
    commandType?: string;
    aggregateContext?: string;
    aggregateName?: string;
  }): RequestHeaders {
    const headers: RequestHeaders = {};

    // Transport-level defaults
    if (this.tenantId) {
      headers[CommandHeaders.TENANT_ID] = this.tenantId;
    }
    if (this.ownerId) {
      headers[CommandHeaders.OWNER_ID] = this.ownerId;
    }
    if (this.spaceId) {
      headers[CommandHeaders.SPACE_ID] = this.spaceId;
    }

    // Request-specific overrides
    if (options?.aggregateId) {
      headers[CommandHeaders.AGGREGATE_ID] = options.aggregateId;
    }
    if (options?.aggregateVersion !== undefined) {
      headers[CommandHeaders.AGGREGATE_VERSION] =
        options.aggregateVersion.toString();
    }
    if (options?.waitStage) {
      headers[CommandHeaders.WAIT_STAGE] = options.waitStage;
    } else {
      headers[CommandHeaders.WAIT_STAGE] = this.defaultWaitStage;
    }
    if (options?.waitTimeout) {
      headers[CommandHeaders.WAIT_TIME_OUT] = options.waitTimeout.toString();
    } else {
      headers[CommandHeaders.WAIT_TIME_OUT] = this.defaultWaitTimeout.toString();
    }
    if (options?.commandType) {
      headers[CommandHeaders.COMMAND_TYPE] = options.commandType;
    }
    if (options?.aggregateContext) {
      headers[CommandHeaders.COMMAND_AGGREGATE_CONTEXT] = options.aggregateContext;
    }
    if (options?.aggregateName) {
      headers[CommandHeaders.COMMAND_AGGREGATE_NAME] = options.aggregateName;
    }
    if (options?.customHeaders) {
      Object.assign(headers, options.customHeaders);
    }

    return headers;
  }

  /**
   * Builds query request headers.
   *
   * @returns Query headers with content type
   */
  private buildQueryHeaders(): RequestHeaders {
    return {
      'Content-Type': ContentTypeValues.APPLICATION_JSON,
    };
  }

  // ===========================================================================
  // Command Operations
  // ===========================================================================

  /**
   * Sends a command to the Wow CQRS backend and waits for the result.
   *
   * This is the primary method for executing commands in the Wow CQRS model.
   * Commands represent intent to change state and are processed by aggregates.
   *
   * @template C - The command body type
   * @param commandName - The name/type of the command to send
   * @param commandBody - The command payload data
   * @param options - Optional command configuration
   * @param options.aggregateId - Target aggregate ID
   * @param options.aggregateVersion - Expected aggregate version for optimistic locking
   * @param options.waitStage - The command stage to wait for (default: SNAPSHOT)
   * @param options.waitTimeout - Timeout for waiting on command stage
   * @param options.timeout - Request timeout in milliseconds
   * @param options.commandType - Optional command type override
   * @returns Promise resolving to the command result
   *
   * @example
   * ```typescript
   * const result = await transport.sendCommand('add_cart_item', {
   *   productId: 'product-1',
   *   quantity: 2,
   * }, {
   *   aggregateId: 'cart-123',
   *   waitStage: CommandStage.SNAPSHOT,
   * });
   *
   * if (result.success) {
   *   console.log('Command executed:', result.data.commandId);
   *   console.log('New aggregate version:', result.data.aggregateVersion);
   * } else {
   *   console.error('Command failed:', result.error);
   * }
   * ```
   */
  async sendCommand<C extends object = object>(
    commandName: string,
    commandBody: C,
    options?: {
      aggregateId?: string;
      aggregateVersion?: number;
      waitStage?: CommandStage;
      waitTimeout?: number;
      timeout?: number;
      commandType?: string;
      aggregateContext?: string;
      aggregateName?: string;
    },
  ): Promise<WowCommandResponse<CommandResult>> {
    try {
      const url = '/commands';
      const request: FetchRequest = {
        method: HttpMethod.POST,
        url,
        headers: this.buildCommandHeaders({
          aggregateId: options?.aggregateId,
          aggregateVersion: options?.aggregateVersion,
          waitStage: options?.waitStage,
          waitTimeout: options?.waitTimeout,
          commandType: options?.commandType ?? commandName,
          aggregateContext: options?.aggregateContext,
          aggregateName: options?.aggregateName,
        }),
        body: {
          commandType: commandName,
          payload: commandBody,
        },
        timeout: options?.timeout,
      };

      const response = await this.fetcher.fetch<CommandResult>(url, {
        method: HttpMethod.POST,
        url,
        headers: this.buildCommandHeaders({
          aggregateId: options?.aggregateId,
          aggregateVersion: options?.aggregateVersion,
          waitStage: options?.waitStage ?? this.defaultWaitStage,
          waitTimeout: options?.waitTimeout ?? this.defaultWaitTimeout,
          commandType: options?.commandType ?? commandName,
        }),
        body: {
          commandType: commandName,
          payload: commandBody,
        },
        timeout: options?.timeout,
      } as FetchRequestInit);

      return {
        data: response,
        success: true,
        statusCode: 200,
      };
    } catch (error: any) {
      return {
        data: null as any,
        success: false,
        statusCode: error.statusCode,
        error: this.normalizeError(error, 'COMMAND_FAILED'),
      };
    }
  }

  /**
   * Sends a command and returns a stream of results for long-running commands.
   *
   * This is useful for commands that produce multiple events across different
   * processing stages. The returned stream emits CommandResult events as each
   * stage completes.
   *
   * @template C - The command body type
   * @param commandName - The name/type of the command to send
   * @param commandBody - The command payload data
   * @param options - Optional command configuration
   * @returns Promise resolving to a stream of command results
   *
   * @example
   * ```typescript
   * const stream = await transport.sendCommandAndWaitStream('process_order', {
   *   orderId: 'order-123',
   * }, {
   *   aggregateId: 'order-123',
   * });
   *
   * for await (const event of stream) {
   *   console.log('Stage completed:', event.data.stage);
   *   if (event.data.aggregateVersion) {
   *     console.log('Version:', event.data.aggregateVersion);
   *   }
   * }
   * ```
   */
  async sendCommandAndWaitStream<C extends object = object>(
    commandName: string,
    commandBody: C,
    options?: {
      aggregateId?: string;
      aggregateVersion?: number;
      timeout?: number;
      commandType?: string;
    },
  ): Promise<CommandResultEventStream> {
    const request: FetchRequestInit = {
      method: HttpMethod.POST,
      url: '/commands/stream',
      headers: {
        ...this.buildCommandHeaders({
          aggregateId: options?.aggregateId,
          aggregateVersion: options?.aggregateVersion,
          commandType: options?.commandType ?? commandName,
        }),
        Accept: ContentTypeValues.TEXT_EVENT_STREAM,
      },
      body: {
        commandType: commandName,
        payload: commandBody,
      },
      timeout: options?.timeout,
    };

    const response = await this.fetcher.fetch<Response>('/commands/stream', request);
    return response.body as CommandResultEventStream;
  }

  // ===========================================================================
  // Query Operations
  // ===========================================================================

  /**
   * Creates a QueryClientFactory configured for this transport.
   *
   * The factory creates query clients for different query patterns:
   * - Snapshot queries for aggregate state
   * - Event stream queries for domain events
   * - State aggregate queries for loading aggregate state
   *
   * @template S - The aggregate state type
   * @template FIELDS - The queryable fields type
   * @template DomainEventBody - The domain event body type
   * @param defaultOptions - Default options for all created clients
   * @returns Configured QueryClientFactory instance
   *
   * @example
   * ```typescript
   * const factory = transport.createQueryClientFactory<CartState>({
   *   contextAlias: 'shop',
   *   aggregateName: 'cart',
   * });
   *
   * // Create a snapshot query client
   * const snapshotClient = factory.createSnapshotQueryClient();
   * const cart = await snapshotClient.singleState({ condition: all() });
   *
   * // Create an event stream query client
   * const eventClient = factory.createEventStreamQueryClient();
   * const events = await eventClient.list({ condition: all() });
   * ```
   */
  createQueryClientFactory<
    S,
    FIELDS extends string = string,
    DomainEventBody = any,
  >(defaultOptions?: QueryClientOptions): QueryClientFactory<S, FIELDS, DomainEventBody> {
    const mergedOptions: QueryClientOptions = {
      ...defaultOptions,
      fetcher: this.fetcher,
    };

    if (this.tenantId) {
      mergedOptions.contextAlias = this.tenantId;
    }

    return new QueryClientFactory<S, FIELDS, DomainEventBody>(mergedOptions);
  }

  /**
   * Queries aggregate state directly using the transport's fetcher.
   *
   * This is a simplified query method for basic state retrieval.
   * For complex query patterns, use the QueryClientFactory.
   *
   * @template S - The aggregate state type
   * @param aggregateName - The name of the aggregate to query
   * @param aggregateId - The ID of the aggregate instance
   * @param options - Query options
   * @param options.version - Specific version to retrieve
   * @param options.asOfTime - Time-travel query timestamp
   * @param options.fields - Partial field selection
   * @param options.timeout - Request timeout
   * @returns Promise resolving to the aggregate state
   *
   * @example
   * ```typescript
   * const cart = await transport.queryState<CartState>('cart', 'cart-123');
   * console.log('Cart items:', cart.data.items);
   * ```
   */
  async queryState<S = any>(
    aggregateName: string,
    aggregateId: string,
    options?: {
      version?: number;
      asOfTime?: number;
      fields?: string[];
      timeout?: number;
    },
  ): Promise<WowQueryResponse<S>> {
    try {
      const queryParams = new URLSearchParams();
      if (options?.version !== undefined) {
        queryParams.set('version', options.version.toString());
      }
      if (options?.asOfTime !== undefined) {
        queryParams.set('asOfTime', options.asOfTime.toString());
      }
      if (options?.fields?.length) {
        queryParams.set('fields', options.fields.join(','));
      }

      const queryString = queryParams.toString();
      const url = `/snapshots/${aggregateName}/${aggregateId}${queryString ? `?${queryString}` : ''}`;

      const response = await this.fetcher.fetch<S>(url, {
        method: HttpMethod.GET,
        headers: this.buildQueryHeaders(),
        timeout: options?.timeout,
      });

      return {
        data: response,
        success: true,
        statusCode: 200,
      };
    } catch (error: any) {
      return {
        data: null as any,
        success: false,
        statusCode: error.statusCode,
        error: this.normalizeError(error, 'QUERY_FAILED'),
      };
    }
  }

  /**
   * Queries domain events for an aggregate.
   *
   * @param aggregateName - The name of the aggregate
   * @param aggregateId - The ID of the aggregate instance
   * @param options - Query options
   * @param options.sinceTime - Filter events after this timestamp
   * @param options.untilTime - Filter events before this timestamp
   * @param options.limit - Maximum number of events to return
   * @param options.timeout - Request timeout
   * @returns Promise resolving to array of domain events
   *
   * @example
   * ```typescript
   * const events = await transport.queryEvents('cart', 'cart-123', {
   *   sinceTime: Date.now() - 86400000,
   *   limit: 100,
   * });
   *
   * for (const event of events.data) {
   *   console.log('Event:', event.type, event.data);
   * }
   * ```
   */
  async queryEvents(
    aggregateName: string,
    aggregateId: string,
    options?: {
      sinceTime?: number;
      untilTime?: number;
      limit?: number;
      timeout?: number;
    },
  ): Promise<WowQueryResponse<any[]>> {
    try {
      const queryParams = new URLSearchParams();
      if (options?.sinceTime !== undefined) {
        queryParams.set('sinceTime', options.sinceTime.toString());
      }
      if (options?.untilTime !== undefined) {
        queryParams.set('untilTime', options.untilTime.toString());
      }
      if (options?.limit !== undefined) {
        queryParams.set('limit', options.limit.toString());
      }

      const queryString = queryParams.toString();
      const url = `/events/${aggregateName}/${aggregateId}${queryString ? `?${queryString}` : ''}`;

      const response = await this.fetcher.fetch<any[]>(url, {
        method: HttpMethod.GET,
        headers: this.buildQueryHeaders(),
        timeout: options?.timeout,
      });

      return {
        data: response,
        success: true,
        statusCode: 200,
      };
    } catch (error: any) {
      return {
        data: null as any,
        success: false,
        statusCode: error.statusCode,
        error: this.normalizeError(error, 'EVENT_QUERY_FAILED'),
      };
    }
  }

  // ===========================================================================
  // Error Handling
  // ===========================================================================

  /**
   * Normalizes error information from various sources into a consistent format.
   *
   * @param error - The error to normalize
   * @param defaultCode - Default error code if none can be determined
   * @returns Normalized WowErrorInfo
   */
  private normalizeError(error: any, defaultCode: string): WowErrorInfo {
    // Handle Wow-specific error responses
    if (error.response?.data) {
      const data = error.response.data;
      return {
        code: data.code ?? data.errorCode ?? defaultCode,
        message: data.message ?? data.errorMessage ?? 'Unknown error',
        details: data.details ?? data.errorDetails,
        stack: data.stackTrace,
      };
    }

    // Handle standard error objects
    return {
      code: error.code ?? error.name ?? defaultCode,
      message: error.message ?? 'An unexpected error occurred',
      details: error,
      stack: error.stack,
    };
  }
}

// =============================================================================
// Factory Function
// =============================================================================

/**
 * Creates a pre-configured WowTransport instance.
 *
 * This is a convenience factory function that creates a transport
 * with typical settings for a Wow CQRS backend.
 *
 * @param options - Configuration options
 * @returns Configured WowTransport instance
 *
 * @example
 * ```typescript
 * const transport = createWowTransport({
 *   baseURL: 'https://api.example.com/wow',
 *   tenantId: 'my-tenant',
 * });
 *
 * const result = await transport.sendCommand('create_order', orderData);
 * ```
 */
export function createWowTransport(
  options: WowTransportOptions = {},
): WowTransport {
  return new WowTransport(options);
}

// =============================================================================
// Re-exports for Convenience
// =============================================================================

export type {
  CommandRequest,
  CommandResult,
  CommandResultEventStream,
  QueryClientOptions,
  SnapshotQueryClient,
  EventStreamQueryClient,
  LoadStateAggregateClient,
  LoadOwnerStateAggregateClient,
  QueryClientFactory,
} from '@ahoo-wang/fetcher-wow';

export {
  CommandHeaders,
  CommandStage,
  createQueryApiMetadata,
} from '@ahoo-wang/fetcher-wow';
