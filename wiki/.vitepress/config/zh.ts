import type { DefaultTheme } from 'vitepress';

export const zh: DefaultTheme.Config = {
  label: '中文',
  lang: 'zh-CN',
  title: 'Fetcher',
  description: '类型化 HTTP 客户端、流式响应、React Hooks 与数据 Viewer',
  themeConfig: {
    nav: [
      { text: '开始', link: '/zh/start/' },
      { text: '学习', link: '/zh/learn/request-lifecycle' },
      { text: '场景', link: '/zh/recipes/declarative-services' },
      { text: '参考', link: '/zh/reference/' },
      { text: '贡献', link: '/zh/contributing/' },
      { text: 'Storybook', link: '/storybook/', target: '_blank' },
    ],
    sidebar: {
      '/zh/start/': [
        {
          text: '开始',
          items: [
            { text: '概览', link: '/zh/start/' },
            { text: '安装', link: '/zh/start/installation' },
            { text: '第一个请求', link: '/zh/start/first-request' },
            { text: '选择包', link: '/zh/start/choose-packages' },
          ],
        },
      ],
      '/zh/learn/': [
        {
          text: '学习',
          items: [
            { text: '请求生命周期', link: '/zh/learn/request-lifecycle' },
            { text: '请求与结果', link: '/zh/learn/requests-and-results' },
            {
              text: '拦截器、错误与超时',
              link: '/zh/learn/interceptors-errors-timeouts',
            },
            { text: '流式响应', link: '/zh/learn/streaming' },
            { text: 'React 数据流', link: '/zh/learn/react-data-flow' },
          ],
        },
      ],
      '/zh/recipes/': [
        {
          text: '场景',
          items: [
            {
              text: '声明式服务',
              link: '/zh/recipes/declarative-services',
            },
            { text: '生成客户端', link: '/zh/recipes/openapi-client' },
            {
              text: 'OpenAI 流式请求',
              link: '/zh/recipes/openai-streaming',
            },
            { text: 'Wow CQRS', link: '/zh/recipes/wow-cqrs' },
            { text: 'CoSec 认证', link: '/zh/recipes/cosec-authentication' },
            { text: '状态与事件', link: '/zh/recipes/state-and-events' },
            { text: '数据 Viewer', link: '/zh/recipes/data-viewer' },
          ],
        },
      ],
      '/zh/reference/': [
        {
          text: '参考',
          items: [
            { text: '包', link: '/zh/reference/' },
            { text: 'Fetcher', link: '/zh/reference/fetcher' },
            { text: 'Decorator', link: '/zh/reference/decorator' },
            { text: '事件总线', link: '/zh/reference/eventbus' },
            { text: '事件流', link: '/zh/reference/eventstream' },
            { text: 'Storage', link: '/zh/reference/storage' },
            { text: 'React', link: '/zh/reference/react' },
            { text: 'OpenAPI', link: '/zh/reference/openapi' },
            { text: 'Generator', link: '/zh/reference/generator' },
            { text: 'OpenAI', link: '/zh/reference/openai' },
            { text: 'Wow', link: '/zh/reference/wow' },
            { text: 'CoSec', link: '/zh/reference/cosec' },
            { text: 'Viewer', link: '/zh/reference/viewer' },
          ],
        },
      ],
      '/zh/contributing/': [
        {
          text: '贡献',
          items: [
            { text: '概览', link: '/zh/contributing/' },
            { text: '开发', link: '/zh/contributing/development' },
            { text: '测试', link: '/zh/contributing/testing' },
            { text: '文档', link: '/zh/contributing/documentation' },
          ],
        },
      ],
    },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/Ahoo-Wang/fetcher' },
    ],
    footer: {
      message: '基于 Apache License 2.0 发布。',
      copyright: 'Copyright 2024-present Ahoo Wang',
    },
    editLink: {
      pattern: 'https://github.com/Ahoo-Wang/fetcher/edit/main/wiki/:path',
      text: '在 GitHub 上编辑此页面',
    },
    outline: { label: '页面导航' },
    lastUpdated: { text: '最后更新于' },
    docFooter: { prev: '上一页', next: '下一页' },
  },
};
