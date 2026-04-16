import { ParallelTypedEventBus } from '@ahoo-wang/fetcher-eventbus';

// Type definitions for order events
interface OrderUpdateEvent {
  orderId: string;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered';
  items: Array<{ productId: string; quantity: number }>;
  total: number;
}

type OrderEvent = OrderUpdateEvent;

// Create a parallel typed event bus
const eventBus = new ParallelTypedEventBus<OrderEvent>('order-events');

// Handler 1: Update UI (runs in parallel with others)
eventBus.on({
  name: 'ui-updater',
  order: 1,
  handle: async (event) => {
    console.log('[UI] Updating order display:', event.orderId, event.status);
    // Update the UI with order status
  },
});

// Handler 2: Persist to storage (runs in parallel with others)
eventBus.on({
  name: 'storage-persister',
  order: 2,
  handle: async (event) => {
    try {
      console.log('[Storage] Persisting order:', event.orderId);
      await saveToStorage(event);
    } catch (error) {
      console.error('[Storage] Failed to persist:', error);
      throw error; // Re-throw to trigger error handling
    }
  },
});

// Handler 3: Send notifications (runs in parallel with others)
eventBus.on({
  name: 'notification-sender',
  order: 3,
  handle: async (event) => {
    try {
      console.log('[Notification] Sending for order:', event.orderId);
      await sendNotification(event);
    } catch (error) {
      console.error('[Notification] Failed to send:', error);
      // Error is caught but not re-thrown - other handlers shouldn't fail
    }
  },
});

// Emit an order update event - all handlers run in parallel
await eventBus.emit({
  orderId: 'ORD-12345',
  status: 'confirmed',
  items: [
    { productId: 'PROD-001', quantity: 2 },
    { productId: 'PROD-002', quantity: 1 },
  ],
  total: 129.99,
});

// Helper functions
async function saveToStorage(event: OrderUpdateEvent): Promise<void> {
  // Simulate async storage operation
  return new Promise((resolve) => setTimeout(resolve, 100));
}

async function sendNotification(event: OrderUpdateEvent): Promise<void> {
  // Simulate async notification sending
  return new Promise((resolve) => setTimeout(resolve, 100));
}

// Clean up
eventBus.destroy();
