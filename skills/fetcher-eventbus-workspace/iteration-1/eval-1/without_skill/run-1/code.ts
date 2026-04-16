// Cross-tab communication using BroadcastChannel
// Basic implementation without the fetcher-eventbus package

class BroadcastChannelMessenger {
  private channel: BroadcastChannel;

  constructor(channelName: string) {
    this.channel = new BroadcastChannel(channelName);
    this.channel.onmessage = (event) => {
      if (this.onmessage) {
        this.onmessage(event.data);
      }
    };
  }

  onmessage: ((message: any) => void) | null = null;

  postMessage(message: any): void {
    this.channel.postMessage(message);
  }

  close(): void {
    this.channel.close();
  }
}

const messenger = new BroadcastChannelMessenger('user-preferences');

messenger.onmessage = (message) => {
  console.log('[Cross-Tab] Received:', message);
};

messenger.postMessage({ type: 'PREFERENCE_UPDATE', key: 'theme', value: 'dark' });
messenger.close();
