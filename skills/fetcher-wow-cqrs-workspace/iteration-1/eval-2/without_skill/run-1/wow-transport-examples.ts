/*
 * WowTransport Usage Examples
 *
 * This file demonstrates various usage patterns for the WowTransport class,
 * including command sending, query operations, and type handling.
 */

import {
  WowTransport,
  createWowTransport,
  type WowCommandResponse,
  type WowQueryResponse,
  CommandStage,
} from './wow-transport';
import type {
  CommandResult,
  AggregateId,
  AggregateNameCapable,
} from '@ahoo-wang/fetcher-wow';

// =============================================================================
// Type Definitions for Commands and Queries
// =============================================================================

/**
 * Example: Shopping Cart Command Types
 */
interface AddCartItemCommand {
  productId: string;
  quantity: number;
  price: number;
}

interface RemoveCartItemCommand {
  productId: string;
}

interface CheckoutCommand {
  paymentMethod: string;
  shippingAddress: string;
}

/**
 * Example: Shopping Cart Query Types
 */
interface CartState {
  id: string;
  items: CartItem[];
  totalAmount: number;
  status: 'ACTIVE' | 'CHECKED_OUT' | 'ABANDONED';
}

interface CartItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
}

/**
 * Example: Domain Events
 */
interface CartItemAddedEvent {
  eventType: 'CartItemAdded';
  productId: string;
  quantity: number;
  cartId: string;
  timestamp: number;
}

interface CartCheckedOutEvent {
  eventType: 'CartCheckedOut';
  cartId: string;
  orderId: string;
  timestamp: number;
}

type CartDomainEvent = CartItemAddedEvent | CartCheckedOutEvent;

// =============================================================================
// Basic Usage
// =============================================================================

/**
 * Example 1: Creating a WowTransport instance
 */
function basicUsage(): void {
  // Using constructor
  const transport1 = new WowTransport({
    baseURL: 'https://api.example.com/wow',
    tenantId: 'tenant-123',
    ownerId: 'owner-456',
    timeout: 30000,
  });

  // Using factory function
  const transport2 = createWowTransport({
    baseURL: 'https://api.example.com/wow',
  });

  console.log('Base URL:', transport2.getBaseURL());
}

// =============================================================================
// Sending Commands
// =============================================================================

/**
 * Example 2: Sending a simple command
 */
async function sendSimpleCommand(): Promise<void> {
  const transport = new WowTransport({
    baseURL: 'https://api.example.com/wow',
  });

  const result: WowCommandResponse<CommandResult> = await transport.sendCommand(
    'add_cart_item',
    {
      productId: 'product-123',
      quantity: 2,
      price: 29.99,
    } as AddCartItemCommand,
  );

  if (result.success) {
    console.log('Command result:', result.data);
    // Access command result properties
    const commandId = result.data.commandId;
    const aggregateId = result.data.aggregateId;
    const aggregateVersion = result.data.aggregateVersion;
  } else {
    console.error('Command failed:', result.error);
  }
}

/**
 * Example 3: Sending a command with aggregate targeting
 */
async function sendCommandWithAggregate(): Promise<void> {
  const transport = new WowTransport({
    baseURL: 'https://api.example.com/wow',
  });

  // Target a specific aggregate instance
  const result = await transport.sendCommand<RemoveCartItemCommand>(
    'remove_cart_item',
    {
      productId: 'product-456',
    },
    {
      aggregateId: 'cart-789', // Target specific cart
      aggregateVersion: 5, // Optimistic locking
      waitStage: CommandStage.SNAPSHOT,
    },
  );

  if (result.success) {
    console.log('Updated to version:', result.data.aggregateVersion);
  }
}

/**
 * Example 4: Command with timeout override
 */
async function sendCommandWithTimeout(): Promise<void> {
  const transport = new WowTransport({
    baseURL: 'https://api.example.com/wow',
    timeout: 10000, // Default timeout
  });

  // Override timeout for this specific command
  const result = await transport.sendCommand(
    'process_payment',
    { orderId: 'order-123', amount: 99.99 },
    {
      timeout: 60000, // 60 seconds for payment processing
    },
  );

  console.log('Payment result:', result.success ? 'Success' : 'Failed');
}

// =============================================================================
// Streaming Commands
// =============================================================================

/**
 * Example 5: Sending a command with streaming results
 */
async function sendStreamingCommand(): Promise<void> {
  const transport = new WowTransport({
    baseURL: 'https://api.example.com/wow',
  });

  // For long-running commands that produce multiple events
  const resultStream = await transport.sendCommandAndWaitStream<CheckoutCommand>(
    'checkout',
    {
      paymentMethod: 'credit_card',
      shippingAddress: '123 Main St',
    },
    {
      aggregateId: 'cart-123',
    },
  );

  // Process streaming results
  for await (const event of resultStream) {
    console.log('Checkout event:', event.data);
    // Each event.data is a CommandResult representing a stage completion
    if (event.data.aggregateVersion) {
      console.log('Progress - version:', event.data.aggregateVersion);
    }
  }
}

// =============================================================================
// Querying State
// =============================================================================

/**
 * Example 6: Querying aggregate state
 */
async function queryAggregateState(): Promise<void> {
  const transport = new WowTransport({
    baseURL: 'https://api.example.com/wow',
  });

  const result: WowQueryResponse<CartState> = await transport.queryState<CartState>(
    'cart', // aggregate name
    'cart-123', // aggregate ID
    {
      version: 1, // Optional: specific version
      // asOfTime: Date.now(), // Optional: time-travel query
      fields: ['id', 'items', 'totalAmount'], // Optional: partial fields
    },
  );

  if (result.success) {
    const cart: CartState = result.data;
    console.log(`Cart ${cart.id}: ${cart.items.length} items, total: $${cart.totalAmount}`);
  } else {
    console.error('Failed to load cart:', result.error);
  }
}

/**
 * Example 7: Querying domain events
 */
async function queryDomainEvents(): Promise<void> {
  const transport = new WowTransport({
    baseURL: 'https://api.example.com/wow',
  });

  const result: WowQueryResponse<CartDomainEvent[]> = await transport.queryEvents(
    'cart',
    'cart-123',
    {
      sinceTime: Date.now() - 86400000, // Last 24 hours
      limit: 100,
    },
  );

  if (result.success) {
    for (const event of result.data) {
      switch (event.eventType) {
        case 'CartItemAdded':
          console.log(`Item added: ${event.productId} x${event.quantity}`);
          break;
        case 'CartCheckedOut':
          console.log(`Checked out: order ${event.orderId}`);
          break;
      }
    }
  }
}

// =============================================================================
// Using QueryClientFactory
// =============================================================================

/**
 * Example 8: Using QueryClientFactory for complex queries
 */
async function useQueryClientFactory(): Promise<void> {
  const transport = new WowTransport({
    baseURL: 'https://api.example.com/wow',
    tenantId: 'shop-tenant',
    ownerId: 'owner-123',
  });

  // Create a factory with default settings
  const factory = transport.createQueryClientFactory<CartState>({
    contextAlias: 'shop',
    aggregateName: 'cart',
    resourceAttribution: 'owner', // Use owner-based resource attribution
  });

  // Create snapshot query client for state queries
  const snapshotClient = factory.createSnapshotQueryClient<CartState>();
  const currentState = await snapshotClient.singleState({
    condition: { id: 'cart-123' },
  });

  // Create event stream query client for event sourcing
  const eventClient = factory.createEventStreamQueryClient<CartDomainEvent>();
  const events = await eventClient.list({
    condition: { aggregateId: 'cart-123' },
  });

  // Create state aggregate client for loading by ID
  const stateClient = factory.createLoadStateAggregateClient<CartState>();
  const cartById = await stateClient.load('cart-123');

  // Create owner-specific state client
  const ownerStateClient = factory.createOwnerLoadStateAggregateClient<CartState>();
  const myCart = await ownerStateClient.load();

  console.log('Query results:', { currentState, events, cartById, myCart });
}

// =============================================================================
// Type-Safe Command Result Handling
// =============================================================================

/**
 * Example 9: Type-safe result extraction
 */
async function typeSafeResultHandling(): Promise<void> {
  const transport = new WowTransport({
    baseURL: 'https://api.example.com/wow',
  });

  const result = await transport.sendCommand('add_cart_item', {
    productId: 'product-123',
    quantity: 1,
  } as AddCartItemCommand);

  // Type guard for success
  if (result.success) {
    // TypeScript knows result.data is CommandResult here
    const { commandId, requestId, aggregateId, aggregateVersion } = result.data;

    // Access Wow metadata
    if ('boundedContext' in result.data) {
      console.log('Bounded Context:', result.data.boundedContext);
    }

    if ('aggregateName' in result.data) {
      console.log('Aggregate Name:', (result.data as AggregateNameCapable).aggregateName);
    }

    // Check for errors in successful result
    if ('error' in result.data && result.data.error) {
      console.error('Command error:', result.data.error);
    }
  } else {
    // Handle failure case
    console.error(`Error ${result.error?.code}: ${result.error?.message}`);
  }
}

// =============================================================================
// Error Handling Patterns
// =============================================================================

/**
 * Example 10: Comprehensive error handling
 */
async function errorHandling(): Promise<void> {
  const transport = new WowTransport({
    baseURL: 'https://api.example.com/wow',
  });

  try {
    const result = await transport.sendCommand('risky_operation', {
      data: 'some data',
    });

    if (!result.success && result.error) {
      // Structured error handling
      switch (result.error.code) {
        case 'AGGREGATE_NOT_FOUND':
          console.log('The aggregate does not exist');
          break;
        case 'VERSION_CONFLICT':
          console.log('Optimistic locking failure - retry needed');
          break;
        case 'COMMAND_REJECTED':
          console.log('Business rule violation:', result.error.details);
          break;
        default:
          console.log('Unknown error:', result.error);
      }
    }
  } catch (err) {
    // Network-level errors
    console.error('Transport error:', err);
  }
}

// =============================================================================
// Integration with Existing Fetcher
// =============================================================================

/**
 * Example 11: Using an existing Fetcher instance
 */
async function withExistingFetcher(): Promise<void> {
  // If you already have a configured Fetcher instance
  const { Fetcher, InterceptorManager } = await import('@ahoo-wang/fetcher');

  const customInterceptor = {
    order: 1,
    onFulfilled: (config: any) => {
      // Add custom header
      config.headers['X-Custom-Header'] = 'value';
      return config;
    },
  };

  const interceptors = new InterceptorManager();
  interceptors.request.use(customInterceptor);

  const fetcher = new Fetcher({
    baseURL: 'https://api.example.com',
    interceptors,
  });

  // Share the fetcher with WowTransport
  const transport = new WowTransport({
    baseURL: 'https://api.example.com/wow',
    fetcher, // Reuse existing fetcher with custom interceptors
    tenantId: 'tenant-123',
  });

  // Now commands will include the custom header from your interceptor
  const result = await transport.sendCommand('do_something', { data: 'test' });
  console.log('Result:', result.success);
}

// =============================================================================
// Export for use in other modules
// =============================================================================

export {
  // Command types
  AddCartItemCommand,
  RemoveCartItemCommand,
  CheckoutCommand,
  // Query types
  CartState,
  CartItem,
  CartDomainEvent,
  CartItemAddedEvent,
  CartCheckedOutEvent,
  // Example functions
  basicUsage,
  sendSimpleCommand,
  sendCommandWithAggregate,
  sendCommandWithTimeout,
  sendStreamingCommand,
  queryAggregateState,
  queryDomainEvents,
  useQueryClientFactory,
  typeSafeResultHandling,
  errorHandling,
  withExistingFetcher,
};