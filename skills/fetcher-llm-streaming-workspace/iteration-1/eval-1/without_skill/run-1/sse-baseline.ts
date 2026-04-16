// SSE Parsing - Baseline (No Skill)
// Basic SSE parsing without specialized termination detection

interface SSEEvent {
  data: string;
  event?: string;
  id?: string;
  retry?: number;
}

async function parseSSEBasic(response: Response): Promise<void> {
  const reader = response.body?.getReader();
  if (!reader) return;

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6);
        if (data === '[DONE]') {
          console.log('Stream terminated');
          return;
        }
        console.log(`Received: ${data}`);
      }
    }
  }
}

export { parseSSEBasic };
