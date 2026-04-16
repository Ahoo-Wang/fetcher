// SSE Parsing with Termination Detection using Fetcher Eventstream
// Demonstrates proper stream cleanup with TerminateDetector

import '@ahoo-wang/fetcher-eventstream';
import { toJsonServerSentEventStream, type TerminateDetector } from '@ahoo-wang/fetcher-eventstream';

interface ChatCompletionChunk {
  choices: Array<{
    delta: { content?: string };
    finish_reason?: string;
  }>;
}

// OpenAI-style termination: detect [DONE] signal
const terminateOnDone: TerminateDetector = event => event.data === '[DONE]';

async function parseSSEStream(response: Response): Promise<void> {
  // Get the event stream from the response
  const jsonStream = toJsonServerSentEventStream<ChatCompletionChunk>(
    response.requiredEventStream(),
    terminateOnDone,
  );

  let fullContent = '';

  // Parse SSE events with proper termination
  for await (const event of jsonStream) {
    if (event.data) {
      const chunk = event.data;
      const content = chunk.choices[0]?.delta?.content || '';
      fullContent += content;

      if (content) {
        console.log(`Token: ${content}`);
      }

      // Check for finish
      if (chunk.choices[0]?.finish_reason) {
        console.log(`Finished: ${chunk.choices[0].finish_reason}`);
        break;
      }
    }
  }

  console.log(`Full response: ${fullContent}`);
}

export { parseSSEStream, terminateOnDone };
