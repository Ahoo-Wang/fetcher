import { BroadcastChannelMessenger } from '@ahoo-wang/fetcher-eventbus';

// Create a BroadcastChannelMessenger for cross-tab communication
const messenger = new BroadcastChannelMessenger('user-preferences');

// Handle incoming messages from other tabs
messenger.onmessage = (message) => {
  console.log('[Cross-Tab] Received preference update:', message);
  // Apply the preference update to the current tab
};

// Broadcast preference changes to other tabs
function updatePreference(key: string, value: any): void {
  messenger.postMessage({
    type: 'PREFERENCE_UPDATE',
    key,
    value,
    timestamp: Date.now(),
  });
}

// Example: User changes their theme preference
updatePreference('theme', 'dark');
updatePreference('language', 'en-US');

// Clean up when done
messenger.close();
