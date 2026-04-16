import { SerialTypedEventBus } from '@ahoo-wang/fetcher-eventbus';

// Type definitions for login events
interface BaseEvent {
  type: string;
  timestamp: number;
}

interface LoginEvent extends BaseEvent {
  type: 'login';
  payload: {
    userId: string;
    email: string;
    method: 'password' | 'oauth' | 'sso';
  };
}

interface LogoutEvent extends BaseEvent {
  type: 'logout';
  payload: {
    userId: string;
    reason: 'user_initiated' | 'timeout' | 'error';
  };
}

type AuthEvent = LoginEvent | LogoutEvent;

// Create the serial typed event bus
const eventBus = new SerialTypedEventBus<AuthEvent>('auth-events');

// First handler: logs user action
eventBus.on({
  name: 'logger',
  order: 1,
  handle: (event) => {
    console.log('[Logger] Auth event:', event.type, event.payload);
  },
});

// Second handler: updates analytics
eventBus.on({
  name: 'analytics',
  order: 2,
  handle: (event) => {
    console.log('[Analytics] Tracking:', event.type);
    // Analytics integration here
  },
});

// Emit a login event
await eventBus.emit({
  type: 'login',
  timestamp: Date.now(),
  payload: {
    userId: 'user-123',
    email: 'user@example.com',
    method: 'password',
  },
});

// Remove the logger handler using off()
eventBus.off('logger');

// Emit again - only analytics will fire
await eventBus.emit({
  type: 'logout',
  timestamp: Date.now(),
  payload: {
    userId: 'user-123',
    reason: 'user_initiated',
  },
});

// Clean up
eventBus.destroy();
