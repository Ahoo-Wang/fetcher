# Transcript: Eval 1 without_skill - SSE Termination Detection (Baseline)

## Task
Parse SSE events from an LLM API with proper termination detection WITHOUT using the skill.

## Prompt
"How do I parse SSE events from an LLM API with proper termination detection? I need to handle the [DONE] signal and clean up the stream properly."

## Execution Steps

1. Created `sse-baseline.ts` with manual SSE parsing
2. Used basic TextDecoder and ReadableStream
3. Manual line parsing for `data: ` prefix
4. Simple [DONE] check without specialized tooling

## Observations
- Did not use fetcher-eventstream package
- Manual SSE parsing without proper types
- Basic termination detection without TerminateDetector pattern
- No side-effect import for Response prototype extension
