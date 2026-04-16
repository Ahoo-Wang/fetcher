// SerialTypedEventBus for login flow
// Note: This implementation may not use the @ahoo-wang/fetcher-eventbus package correctly

class EventBus<Event> {
  private handlers: Map<string, Array<{name: string; order: number; handle: (event: Event) => void | Promise<void> }>> = new Map();

  on(type: string, handler: {name: string; order: number; handle: (event: Event) => void | Promise<void> }): void {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, []);
    }
    this.handlers.get(type)!.push(handler);
    this.handlers.get(type)!.sort((a, b) => a.order - b.order);
  }

  async emit(type: string, event: Event): Promise<void> {
    const handlers = this.handlers.get(type) || [];
    for (const handler of handlers) {
      await handler.handle(event);
    }
  }

  off(type: string, handlerName?: string): void {
    if (!handlerName) {
      this.handlers.delete(type);
    } else {
      const handlers = this.handlers.get(type) || [];
      this.handlers.set(type, handlers.filter(h => h.name !== handlerName));
    }
  }
}

interface LoginEvent {
  userId: string;
  email: string;
  action: string;
}

const bus = new EventBus<LoginEvent>();

// Log user action
bus.on('login', {
  name: 'logger',
  order: 1,
  handle: (event) => console.log('User action:', event),
});

// Update analytics
bus.on('login', {
  name: 'analytics',
  order: 2,
  handle: (event) => console.log('Analytics update:', event),
});

bus.emit('login', { userId: '123', email: 'test@example.com', action: 'login' });
bus.off('login', 'logger');
