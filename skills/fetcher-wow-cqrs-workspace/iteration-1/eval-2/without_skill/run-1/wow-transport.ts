/*
 * WowTransport - Fetcher-based transport for Wow CQRS backend
 *
 * This module provides a WowTransport implementation that uses the fetcher HTTP client
 * to communicate with a Wow CQRS backend. It supports both command and query operations.
 */

import {
  Fetcher,
  type FetcherOptions,
  type FetchRequestInit,
  ContentTypeValues,
  HttpMethod,
} from '@ahoo-wang/fetcher';
import type {
  CommandRequest,
  CommandResult,
  CommandResultEventStream,
} from '@ahoo-wang/fetcher-wow';
import {
  CommandHttpHeaders,
  CommandStage,
  QueryClientFactory,
  SnapshotQueryClient,
  EventStreamQueryClient,
  LoadStateAggregateClient,
  LoadOwnerStateAggregateClient,
  createQueryApiMetadata,
  type QueryClientOptions,
} from '@ahoo-wang/fetcher-wow';

/**
 * Response types for WowTransport operations
 */
export interface WowCommandResponse<T = any> {
  /** The command result data */
  data: T;
  /** Whether the command was successful */
  success: boolean;
  /** Error information if the command failed */
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export interface WowQueryResponse<T = any> {
  /** The query result data */
  data: T;
  /** Whether the query was successful */
  success: boolean;
  /** Error information if the query failed */
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

/**
 * Configuration options for WowTransport
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
   */
  timeout?: number;

  /**
   * Default headers to include in all requests.
   */
  headers?: Record<string, string>;

  /**
   * The Fetcher instance to use.
   * If not provided, a new Fetcher will be created.
   */
  fetcher?: Fetcher;

  /**
   * Tenant identifier for multi-tenant setups.
   */
  tenantId?: string;

  /**
   * Owner identifier for owner-based resource attribution.
   */
  ownerId?: string;
}

/**
 * WowTransport - A fetcher-based transport for Wow CQRS operations
 *
 * This transport provides a simple interface for sending commands and queries
 * to a Wow CQRS backend. It wraps the fetcher HTTP client with Wow-specific
 * semantics including command staging, result extraction, and error handling.
 *
 * @example
 * ```typescript
 * // Create transport with default configuration
 * const transport = new WowTransport({
 *   baseURL: 'https://api.example.com/wow',
 *   tenantId: 'tenant-123',
 *   ownerId: 'owner-456',
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
 */
export class WowTransport {
  private readonly fetcher: Fetcher;
  private readonly baseURL: string;
  private readonly tenantId?: string;
  private readonly ownerId?: string;

  /**
   * Creates a new WowTransport instance.
   *
   * @param options - Configuration options for the transport
   */
  constructor(options: WowTransportOptions = {}) {
    this.baseURL = options.baseURL ?? 'https://api.example.com/wow';
    this.tenantId = options.tenantId;
    this.ownerId = options.ownerId;

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

  /**
   * Gets the underlying Fetcher instance.
   *
   * This allows direct access to the fetcher for custom operations
   * that are not covered by the transport's high-level API.
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
   * Builds command request headers with Wow-specific headers.
   *
   * @param options - Optional header overrides
   * @returns Complete command headers
   */
  private buildCommandHeaders(options?: {
    aggregateId?: string;
    aggregateVersion?: number;
    waitStage?: CommandStage;
    customHeaders?: Record<string, string>;
  }): Record<string, string> {
    const headers: Record<string, string> = {
      [CommandHttpHeaders.CONTENT_TYPE]: ContentTypeValues.APPLICATION_JSON,
    };

    if (this.tenantId) {
      headers[CommandHttpHeaders.TENANT_ID] = this.tenantId;
    }

    if (this.ownerId) {
      headers[CommandHttpHeaders.OWNER_ID] = this.ownerId;
    }

    if (options?.aggregateId) {
      headers[CommandHttpHeaders.AGGREGATE_ID] = options.aggregateId;
    }

    if (options?.aggregateVersion !== undefined) {
      headers[CommandHttpHeaders.AGGREGATE_VERSION] =
        options.aggregateVersion.toString();
    }

    if (options?.waitStage) {
      headers[CommandHttpHeaders.WAIT_STAGE] = options.waitStage;
    }

    if (options?.customHeaders) {
      Object.assign(headers, options.customHeaders);
    }

    return headers;
  }

  /**
   * Sends a command to the Wow CQRS backend and waits for the result.
   *
   * @param commandName - The name/type of the command to send
   * @param commandBody - The command payload data
   * @param options - Optional command configuration
   * @param options.aggregateId - Target aggregate ID
   * @param options.aggregateVersion - Expected aggregate version for optimistic locking
   * @param options.waitStage - The command stage to wait for (default: SNAPSHOT)
   * @param options.timeout - Request timeout in milliseconds
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
   *   console.log('Command executed:', result.data);
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
      timeout?: number;
    },
  ): Promise<WowCommandResponse<CommandResult>> {
    try {
      const request: FetchRequestInit = {
        method: HttpMethod.POST,
        url: `/commands/${commandName}`,
        headers: this.buildCommandHeaders({
          aggregateId: options?.aggregateId,
          aggregateVersion: options?.aggregateVersion,
          waitStage: options?.waitStage ?? CommandStage.SNAPSHOT,
        }),
        body: commandBody,
        timeout: options?.timeout,
      };

      const response = await this.fetcher.fetch<CommandResult>(
        '/commands',
        request,
      );

      return {
        data: response,
        success: true,
      };
    } catch (error: any) {
      return {
        data: null as any,
        success: false,
        error: {
          code: error.code ?? 'COMMAND_FAILED',
          message: error.message ?? 'Command execution failed',
          details: error,
        },
      };
    }
  }

  /**
   * Sends a command and returns a stream of results for long-running commands.
   *
   * @param commandName - The name/type of the command to send
   * @param commandBody - The command payload data
   * @param options - Optional command configuration
   * @returns Promise resolving to a stream of command results
   *
   * @example
   * ```typescript
   * const stream = await transport.sendCommandAndWaitStream('process_order', {
   *   orderId: 'order-123',
   * });
   *
   * for await (const event of stream) {
   *   console.log('Command event:', event.data);
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
    },
  ): Promise<CommandResultEventStream> {
    const request: FetchRequestInit = {
      method: HttpMethod.POST,
      url: `/commands/${commandName}`,
      headers: {
        ...this.buildCommandHeaders({
          aggregateId: options?.aggregateId,
          aggregateVersion: options?.aggregateVersion,
        }),
        Accept: ContentTypeValues.TEXT_EVENT_STREAM,
      },
      body: commandBody,
      timeout: options?.timeout,
    };

    // For streaming, we return the raw response for the caller to process
    const response = await this.fetcher.fetch<Response>('/commands', request);
    return response.body as CommandResultEventStream;
  }

  /**
   * Creates a QueryClientFactory configured for this transport.
   *
   * The factory creates query clients for different query patterns:
   * - Snapshot queries for aggregate state
   * - Event stream queries for domain events
   * - State aggregate queries for loading aggregate state
   *
   * @param defaultOptions - Default options for all created clients
   * @returns Configured QueryClientFactory instance
   *
   * @example
   * ```typescript
   * const factory = transport.createQueryClientFactory({
   *   contextAlias: 'shop',
   *   aggregateName: 'cart',
   *   resourceAttribution: ResourceAttributionPathSpec.OWNER,
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
    // Merge transport-level defaults with provided options
    const mergedOptions: QueryClientOptions = {
      ...defaultOptions,
      basePath: this.baseURL,
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
   * @param aggregateName - The name of the aggregate to query
   * @param aggregateId - The ID of the aggregate instance
   * @param options - Query options
   * @returns Promise resolving to the aggregate state
   *
   * @example
   * ```typescript
   * const cart = await transport.queryState('cart', 'cart-123');
   * console.log('Cart items:', cart.items);
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
      let url = `/snapshots/${aggregateName}/${aggregateId}`;

      // Build query parameters
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
      if (queryString) {
        url += `?${queryString}`;
      }

      const response = await this.fetcher.fetch<S>(url, {
        method: HttpMethod.GET,
        headers: this.buildCommandHeaders(),
        timeout: options?.timeout,
      });

      return {
        data: response,
        success: true,
      };
    } catch (error: any) {
      return {
        data: null as any,
        success: false,
        error: {
          code: error.code ?? 'QUERY_FAILED',
          message: error.message ?? 'Query execution failed',
          details: error,
        },
      };
    }
  }

  /**
   * Queries domain events for an aggregate.
   *
   * @param aggregateName - The name of the aggregate
   * @param aggregateId - The ID of the aggregate instance
   * @param options - Query options
   * @returns Promise resolving to array of domain events
   *
   * @example
   * ```typescript
   * const events = await transport.queryEvents('cart', 'cart-123', {
   *   sinceTime: Date.now() - 86400000, // Last 24 hours
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
      const url = `/events/${aggregateName}/${aggregateId}${
        queryString ? `?${queryString}` : ''
      }`;

      const response = await this.fetcher.fetch<any[]>(url, {
        method: HttpMethod.GET,
        headers: this.buildCommandHeaders(),
        timeout: options?.timeout,
      });

      return {
        data: response,
        success: true,
      };
    } catch (error: any) {
      return {
        data: null as any,
        success: false,
        error: {
          code: error.code ?? 'EVENT_QUERY_FAILED',
          message: error.message ?? 'Event query execution failed',
          details: error,
        },
      };
    }
  }
}

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

// Re-export types for convenience
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
  CommandStage,
  CommandHttpHeaders,
  createQueryApiMetadata,
} from '@ahoo-wang/fetcher-wow';