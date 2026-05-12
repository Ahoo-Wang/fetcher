import { DefaultTheme } from 'vitepress'

export const zh: DefaultTheme.Config = {
  label: '中文',
  lang: 'zh-CN',
  title: 'Fetcher',
  description: '现代化 HTTP 客户端生态系统，原生支持 LLM 流式传输',
  themeConfig: {
    nav: [
      { text: '指南', link: '/zh/guide/' },
      { text: '架构', link: '/zh/architecture/' },
      { text: '包', link: '/zh/packages/' },
      { text: 'API', link: '/zh/api/' },
      { text: '入门指南', link: '/zh/onboarding/' },
      {
        text: '更多',
        items: [
          { text: '测试', link: '/zh/testing/' },
          { text: '贡献指南', link: '/zh/guide/contributing' },
          { text: 'Storybook', link: '/storybook/', target: '_blank' },
        ],
      },
    ],
    sidebar: {
      '/zh/guide/': [
        {
          text: '快速开始',
          items: [
            { text: '介绍', link: '/zh/guide/' },
            { text: '快速上手', link: '/zh/guide/quick-start' },
            { text: '配置', link: '/zh/guide/configuration' },
          ],
        },
      ],
      '/zh/architecture/': [
        {
          text: '架构',
          items: [
            { text: '概览', link: '/zh/architecture/' },
            { text: 'Fetcher 核心', link: '/zh/architecture/fetcher-core' },
            { text: '拦截器系统', link: '/zh/architecture/interceptors' },
            { text: 'EventStream 与 SSE', link: '/zh/architecture/eventstream' },
            { text: 'URL 构建器', link: '/zh/architecture/url-builder' },
          ],
        },
      ],
      '/zh/packages/': [
        {
          text: '包',
          items: [
            { text: '概览', link: '/zh/packages/' },
            { text: '@ahoo-wang/fetcher', link: '/zh/packages/fetcher' },
            { text: '@ahoo-wang/fetcher-decorator', link: '/zh/packages/decorator' },
            { text: '@ahoo-wang/fetcher-eventbus', link: '/zh/packages/eventbus' },
            { text: '@ahoo-wang/fetcher-eventstream', link: '/zh/packages/eventstream' },
            { text: '@ahoo-wang/fetcher-openai', link: '/zh/packages/openai' },
            { text: '@ahoo-wang/fetcher-openapi', link: '/zh/packages/openapi' },
            { text: '@ahoo-wang/fetcher-generator', link: '/zh/packages/generator' },
            { text: '@ahoo-wang/fetcher-react', link: '/zh/packages/react' },
            { text: '@ahoo-wang/fetcher-storage', link: '/zh/packages/storage' },
            { text: '@ahoo-wang/fetcher-cosec', link: '/zh/packages/cosec' },
            { text: '@ahoo-wang/fetcher-wow', link: '/zh/packages/wow' },
            { text: '@ahoo-wang/fetcher-viewer', link: '/zh/packages/viewer' },
          ],
        },
      ],
      '/zh/api/': [
        {
          text: 'API 参考',
          items: [
            { text: '概览', link: '/zh/api/' },
            { text: 'Fetcher 客户端', link: '/zh/api/fetcher-client' },
            { text: '装饰器', link: '/zh/api/decorators' },
            { text: 'React Hooks', link: '/zh/api/react-hooks' },
            { text: '类型定义', link: '/zh/api/type-definitions' },
          ],
        },
      ],
      '/zh/testing/': [
        {
          text: '测试',
          items: [
            { text: '概览', link: '/zh/testing/' },
            { text: '单元测试', link: '/zh/testing/unit-testing' },
            { text: '集成测试', link: '/zh/testing/integration-testing' },
            { text: '浏览器测试', link: '/zh/testing/browser-testing' },
          ],
        },
      ],
      '/zh/onboarding/': [
        {
          text: '入门指南',
          collapsed: false,
          items: [
            { text: '贡献者指南', link: '/zh/onboarding/contributor' },
            { text: '高级工程师指南', link: '/zh/onboarding/staff-engineer' },
            { text: '管理层指南', link: '/zh/onboarding/executive' },
            { text: '产品经理指南', link: '/zh/onboarding/product-manager' },
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
    outline: {
      label: '页面导航',
    },
    lastUpdated: {
      text: '最后更新于',
    },
    docFooter: {
      prev: '上一页',
      next: '下一页',
    },
  },
}
