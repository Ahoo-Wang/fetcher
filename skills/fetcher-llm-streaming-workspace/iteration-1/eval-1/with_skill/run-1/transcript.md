# Transcript: Eval 1 with_skill - SSE Termination Detection

## Task
Parse SSE events from an LLM API with proper termination detection.

## Prompt
"How do I parse SSE events from an LLM API with proper termination detection? I need to handle the [DONE] signal and clean up the stream properly."

## Execution Steps

1. Created `sse-termination.ts` demonstrating SSE parsing
2. Used side-effect import: `import '@ahoo-wang/fetcher-eventstream';`
3. Implemented TerminateDetector for [DONE] signal: `event => event.data === '[DONE]'`
4. Used `toJsonServerSentEventStream()` for typed JSON stream parsing
5. Proper stream cleanup with break on finish_reason

## Key Patterns Used
- `requiredEventStream()` for SSE stream extraction
- `TerminateDetector` type for clean termination
- OpenAI-style `event.data === '[DONE]'` check
- Proper stream cleanup on finish_reason
