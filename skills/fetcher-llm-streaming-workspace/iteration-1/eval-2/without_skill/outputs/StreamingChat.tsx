// Streaming Chat - Baseline (No Skill)
// Basic React streaming chat without specialized patterns

import React, { useState, useCallback } from 'react';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export function StreamingChat() {
  const [messages, setMessages] = useState<Array<{role: string; content: string}>>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsStreaming(true);

    try {
      const stream = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [...messages, userMessage],
        stream: true,
      });

      let fullResponse = '';
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          fullResponse += content;
        }
        if (chunk.choices[0]?.finish_reason) break;
      }

      setMessages(prev => [...prev, { role: 'assistant', content: fullResponse }]);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsStreaming(false);
    }
  }, [input, messages, isStreaming]);

  return (
    <div>
      <div className="messages">
        {messages.map((msg, i) => (
          <div key={i}>{msg.role}: {msg.content}</div>
        ))}
      </div>
      <form onSubmit={handleSubmit}>
        <input value={input} onChange={e => setInput(e.target.value)} />
        <button type="submit" disabled={isStreaming}>Send</button>
      </form>
    </div>
  );
}
