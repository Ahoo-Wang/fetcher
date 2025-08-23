import { Fetcher } from '@ahoo-wang/fetcher';
import { EventStreamInterceptor } from '@ahoo-wang/fetcher-eventstream';

// Create a Fetcher instance with EventStreamInterceptor
const fetcher = new Fetcher({
  baseURL: 'https://jsonplaceholder.typicode.com',
});

// Add the event stream interceptor
fetcher.interceptors.response.use(new EventStreamInterceptor());

// Example: Simulate Server-Sent Events usage
// In a real application, you would connect to an actual SSE endpoint
async function simulateEventStreamUsage() {
  console.log('=== Server-Sent Events Example ===');

  // Note: This is a simulation since we don't have a real SSE endpoint
  // In practice, you would connect to an endpoint that sends text/event-stream

  try {
    console.log('Connecting to event stream...');

    // This is a placeholder - in reality, you'd use:
    // const response = await fetcher.get('/events'); // Endpoint returning text/event-stream
    // if (response.eventStream) {
    //   for await (const event of response.eventStream()) {
    //     console.log('Received event:', event);
    //     // Handle different event types
    //     switch (event.event) {
    //       case 'message':
    //         console.log('Message:', event.data);
    //         break;
    //       case 'notification':
    //         console.log('Notification:', event.data);
    //         break;
    //       case 'update':
    //         console.log('Update:', JSON.parse(event.data));
    //         break;
    //       default:
    //         console.log('Unknown event:', event);
    //     }
    //   }
    // }

    // Simulate receiving events
    const simulatedEvents = [
      { event: 'message', data: 'Hello from server!' },
      { event: 'notification', data: 'You have a new message' },
      { event: 'update', data: '{"userId": 1, "status": "online"}' },
      { event: 'message', data: 'Welcome to the event stream!' },
    ];

    console.log('Simulating received events:');
    for (const event of simulatedEvents) {
      console.log('Event:', event);

      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log('Event stream simulation completed.');
  } catch (error) {
    console.error('Event stream error:', error);
  }
}

// Example: Manual EventStreamConverter usage
async function manualEventStreamConverterUsage() {
  console.log('\n=== Manual EventStreamConverter Example ===');

  try {
    // In a real scenario, you would have a Response object with text/event-stream content
    // const response = await fetch('/events');
    // const eventStream = EventStreamConverter.toEventStream(response);
    //
    // const reader = eventStream.getReader();
    // try {
    //   while (true) {
    //     const { done, value } = await reader.read();
    //     if (done) break;
    //     console.log('Received event:', value);
    //   }
    // } finally {
    //   reader.releaseLock();
    // }

    console.log(
      'Manual EventStreamConverter would process a Response object with text/event-stream content',
    );
    console.log(
      'It converts the response body through a pipeline of transforms:',
    );
    console.log('1. TextDecoderStream: Decodes Uint8Array to UTF-8 strings');
    console.log('2. TextLineStream: Splits text into lines');
    console.log(
      '3. ServerSentEventStream: Parses lines into ServerSentEvent objects',
    );
  } catch (error) {
    console.error('Manual EventStreamConverter error:', error);
  }
}

// Example: Async iterator usage
async function asyncIteratorUsage() {
  console.log('\n=== Async Iterator Example ===');

  try {
    console.log('Using async iteration with event streams:');
    console.log('This provides a clean, readable way to process events:');

    // Simulate async iteration
    const events = [
      { event: 'start', data: 'Stream started' },
      { event: 'progress', data: 'Processing item 1 of 10' },
      { event: 'progress', data: 'Processing item 2 of 10' },
      { event: 'progress', data: 'Processing item 3 of 10' },
      { event: 'complete', data: 'Stream completed' },
    ];

    console.log('Simulating async iteration over events:');
    for (const event of events) {
      console.log(`Event: ${event.event}, Data: ${event.data}`);

      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    console.log('Async iteration completed.');
  } catch (error) {
    console.error('Async iterator error:', error);
  }
}

// Run all examples
async function runAllExamples() {
  await simulateEventStreamUsage();
  await manualEventStreamConverterUsage();
  await asyncIteratorUsage();

  console.log('\n=== All EventStream Examples Completed ===');
}

// Export functions for potential reuse
export {
  simulateEventStreamUsage,
  manualEventStreamConverterUsage,
  asyncIteratorUsage,
  runAllExamples,
};

// Default export
export default runAllExamples;
