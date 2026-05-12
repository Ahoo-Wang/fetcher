---
layout: home

hero:
  name: Fetcher
  text: Modern HTTP Client Ecosystem
  tagline: A modular, TypeScript-first HTTP client built on the native Fetch API with interceptor-powered middleware and native LLM streaming support.
  actions:
    - theme: brand
      text: Get Started
      link: /guide/
    - theme: alt
      text: Architecture
      link: /architecture/
    - theme: alt
      text: View on GitHub
      link: https://github.com/Ahoo-Wang/fetcher

features:
  - icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
    title: Native Fetch API
    details: Built directly on the browser's native Fetch API — no polyfills, no bloat. Axios-like developer experience with a fraction of the bundle size.
  - icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
    title: Interceptor Middleware
    details: Powerful ordered interceptor system for request, response, and error handling. Chain auth, logging, retry, and caching interceptors seamlessly.
  - icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
    title: LLM Streaming
    details: Native Server-Sent Events (SSE) support for real-time LLM response streaming. Side-effect module patches Response.prototype with eventStream() methods.
  - icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>
    title: Decorator API
    details: TypeScript decorators for declarative API service definitions. @get, @post, @put, @delete with automatic parameter binding via @path, @query, @body.
  - icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>
    title: Code Generation
    details: CLI tool that reads OpenAPI 3.x specs and generates type-safe API clients, TypeScript interfaces, and Wow CQRS-specific clients automatically.
  - icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>
    title: Modular Ecosystem
    details: 12 specialized packages — from core HTTP client to React hooks, storage, authentication, and viewer components. Pick only what you need.
---
