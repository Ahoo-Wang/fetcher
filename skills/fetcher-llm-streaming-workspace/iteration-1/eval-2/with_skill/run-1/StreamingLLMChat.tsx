// Streaming LLM Chat Component with Real-Time UI Updates
// Uses fetcher-eventstream for token-by-token updates

import React, { useState, useCallback } from 'react';
import '@ahoo-wang/fetcher-eventstream';
import { OpenAI } from '@ahoo-wang/fetcher-openai';

const openai = new OpenAI({
  baseURL: 'https://api.openai.com/v1',
  apiKey: process.env.OPENAI_API_KEY!,
});

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export function StreamingLLMChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [chunkCount, setChunkCount] = useState(0);
  const [currentResponse, setCurrentResponse] = useState('');

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;

    const userMessage: ChatMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsStreaming(true);
    setChunkCount(0);
    setCurrentResponse('');

    try {
      const stream = await openai.chat.completions({
        model: 'gpt-3.5-turbo',
        messages: [...messages, userMessage].map(m => ({
          role: m.role,
          content: m.content,
        })),
        stream: true,
      });

      let fullResponse = '';
      let chunks = 0;

      // Real-time token processing with UI updates
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          chunks++;
          fullResponse += content;
          setCurrentResponse(fullResponse); // Real-time UI update
          setChunkCount(chunks);

          // Log progress every 5 chunks
          if (chunks % 5 === 0) {
            console.log(`Received ${chunks} chunks`);
          }
        }

        // Check for completion
        if (chunk.choices[0]?.finish_reason) {
          console.log(`Finished: ${chunk.choices[0].finish_reason}`);
          break;
        }
      }

      // Add complete assistant message
      setMessages(prev => [...prev, { role: 'assistant', content: fullResponse }]);
    } catch (error) {
      console.error('Streaming error:', error);
    } finally {
      setIsStreaming(false);
      setCurrentResponse('');
    }
  }, [input, messages, isStreaming]);

  return (
    <div className="streaming-chat">
      <div className="messages">
        {messages.map((msg, i) => (
          <div key={i} className={`message ${msg.role}`}>
            <strong>{msg.role}:</strong> {msg.content}
          </div>
        ))}
        {currentResponse && (
          <div className="message assistant streaming">
            <strong>assistant:</strong> {currentResponse}
            <span className="typing-indicator">...</span>
          </div>
        )}
      </div>

      <div className="stats">
        {isStreaming && <span>Streaming... ({chunkCount} chunks)</span>}
      </div>

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Type your message..."
          disabled={isStreaming}
        />
        <button type="submit" disabled={isStreaming || !input.trim()}>
          {isStreaming ? 'Streaming...' : 'Send'}
        </button>
      </form>
    </div>
  );
}

export default StreamingLLMChat;
