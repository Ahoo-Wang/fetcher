import { DefaultTheme } from 'vitepress'

export const en: DefaultTheme.Config = {
  label: 'English',
  lang: 'en',
  title: 'Fetcher',
  description: 'Modern HTTP Client Ecosystem with Native LLM Streaming Support',
  themeConfig: {
    nav: [
      { text: 'Guide', link: '/guide/' },
      { text: 'Architecture', link: '/architecture/' },
      { text: 'Packages', link: '/packages/' },
      { text: 'API', link: '/api/' },
      { text: 'Onboarding', link: '/onboarding/' },
      {
        text: 'v3.16',
        items: [
          { text: 'Testing', link: '/testing/' },
          { text: 'Contributing', link: '/guide/contributing' },
        ],
      },
    ],
    sidebar: {
      '/guide/': [
        {
          text: 'Getting Started',
          items: [
            { text: 'Introduction', link: '/guide/' },
            { text: 'Quick Start', link: '/guide/quick-start' },
            { text: 'Configuration', link: '/guide/configuration' },
          ],
        },
      ],
      '/architecture/': [
        {
          text: 'Architecture',
          items: [
            { text: 'Overview', link: '/architecture/' },
            { text: 'Fetcher Core', link: '/architecture/fetcher-core' },
            { text: 'Interceptor System', link: '/architecture/interceptors' },
            { text: 'EventStream & SSE', link: '/architecture/eventstream' },
            { text: 'URL Builder', link: '/architecture/url-builder' },
          ],
        },
      ],
      '/packages/': [
        {
          text: 'Packages',
          items: [
            { text: 'Overview', link: '/packages/' },
            { text: '@ahoo-wang/fetcher', link: '/packages/fetcher' },
            { text: '@ahoo-wang/fetcher-decorator', link: '/packages/decorator' },
            { text: '@ahoo-wang/fetcher-eventbus', link: '/packages/eventbus' },
            { text: '@ahoo-wang/fetcher-eventstream', link: '/packages/eventstream' },
            { text: '@ahoo-wang/fetcher-openai', link: '/packages/openai' },
            { text: '@ahoo-wang/fetcher-openapi', link: '/packages/openapi' },
            { text: '@ahoo-wang/fetcher-generator', link: '/packages/generator' },
            { text: '@ahoo-wang/fetcher-react', link: '/packages/react' },
            { text: '@ahoo-wang/fetcher-storage', link: '/packages/storage' },
            { text: '@ahoo-wang/fetcher-cosec', link: '/packages/cosec' },
            { text: '@ahoo-wang/fetcher-wow', link: '/packages/wow' },
            { text: '@ahoo-wang/fetcher-viewer', link: '/packages/viewer' },
          ],
        },
      ],
      '/api/': [
        {
          text: 'API Reference',
          items: [
            { text: 'Overview', link: '/api/' },
            { text: 'Fetcher Client', link: '/api/fetcher-client' },
            { text: 'Decorators', link: '/api/decorators' },
            { text: 'React Hooks', link: '/api/react-hooks' },
            { text: 'Type Definitions', link: '/api/type-definitions' },
          ],
        },
      ],
      '/testing/': [
        {
          text: 'Testing',
          items: [
            { text: 'Overview', link: '/testing/' },
            { text: 'Unit Testing', link: '/testing/unit-testing' },
            { text: 'Integration Testing', link: '/testing/integration-testing' },
            { text: 'Browser Testing', link: '/testing/browser-testing' },
          ],
        },
      ],
      '/onboarding/': [
        {
          text: 'Onboarding',
          collapsed: false,
          items: [
            { text: 'Contributor Guide', link: '/onboarding/contributor' },
            { text: 'Staff Engineer Guide', link: '/onboarding/staff-engineer' },
            { text: 'Executive Guide', link: '/onboarding/executive' },
            { text: 'Product Manager Guide', link: '/onboarding/product-manager' },
          ],
        },
      ],
    },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/Ahoo-Wang/fetcher' },
    ],
    footer: {
      message: 'Released under the Apache License 2.0.',
      copyright: 'Copyright 2024-present Ahoo Wang',
    },
    editLink: {
      pattern: 'https://github.com/Ahoo-Wang/fetcher/edit/main/wiki/:path',
      text: 'Edit this page on GitHub',
    },
  },
}
