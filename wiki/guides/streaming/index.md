---
prev: false
title: Streaming data
description: Choose a concrete task for streaming data.
---

# Streaming data

Your runtime needs Fetch, Response bodies, and ReadableStream. The server must emit SSE frames; a normal JSON response is not an event stream. Keep a caller-owned cancellation signal for long-lived reads.

- [Read and close SSE](./sse.md)
- [Stream completion text](./chat.md)

[All guides](../index.md) · [Integration decisions](../../architecture/integration-decisions.md)
