// Parallel event handling for order updates
// Basic implementation without proper error handling or package

class ParallelEventBus {
  private handlers: Array<{name: string; order: number; handle: (event: any) => Promise<void> }> = [];

  on(handler: {name: string; order: number; handle: (event: any) => Promise<void> }): void {
    this.handlers.push(handler);
    this.handlers.sort((a, b) => a.order - b.order);
  }

  async emit(event: any): Promise<void> {
    // Run all handlers in parallel
    await Promise.all(
      this.handlers.map(async (handler) => {
        try {
          await handler.handle(event);
        } catch (error) {
          console.error(`Handler ${handler.name} failed:`, error);
        }
      })
    );
  }
}

const bus = new ParallelEventBus();

bus.on({
  name: 'ui-updater',
  order: 1,
  handle: async (event) => {
    console.log('[UI] Updating:', event.orderId);
  },
});

bus.on({
  name: 'storage-persister',
  order: 2,
  handle: async (event) => {
    console.log('[Storage] Saving:', event.orderId);
  },
});

bus.on({
  name: 'notification-sender',
  order: 3,
  handle: async (event) => {
    console.log('[Notification] Sending for:', event.orderId);
  },
});

bus.emit({ orderId: 'ORD-123', status: 'confirmed' });
