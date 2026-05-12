---
layout: home

hero:
  name: Fetcher
  text: 现代化 HTTP 客户端生态系统
  tagline: 基于原生 Fetch API 构建的模块化 TypeScript HTTP 客户端，支持拦截器中间件和原生 LLM 流式传输。
  actions:
    - theme: brand
      text: 快速开始
      link: /zh/guide/
    - theme: alt
      text: 架构设计
      link: /zh/architecture/
    - theme: alt
      text: GitHub 仓库
      link: https://github.com/Ahoo-Wang/fetcher

features:
  - icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
    title: 原生 Fetch API
    details: 直接构建在浏览器原生 Fetch API 之上——无需 polyfill，零冗余。提供 Axios 般的开发体验，却拥有极小的包体积。
  - icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
    title: 拦截器中间件
    details: 强大的有序拦截器系统，支持请求、响应和错误处理。无缝链接认证、日志、重试和缓存拦截器。
  - icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
    title: LLM 流式传输
    details: 原生 Server-Sent Events (SSE) 支持，实现实时 LLM 响应流式传输。副作用模块为 Response.prototype 注入 eventStream() 方法。
  - icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>
    title: 装饰器 API
    details: 使用 TypeScript 装饰器定义声明式 API 服务。@get、@post、@put、@delete 配合 @path、@query、@body 实现自动参数绑定。
  - icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>
    title: 代码生成
    details: CLI 工具读取 OpenAPI 3.x 规范，自动生成类型安全的 API 客户端、TypeScript 接口和 Wow CQRS 专用客户端。
  - icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>
    title: 模块化生态
    details: 12 个专用包——涵盖核心 HTTP 客户端、React Hooks、存储、身份验证和查看器组件。按需选用，灵活组合。
---
