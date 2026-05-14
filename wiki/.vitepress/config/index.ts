import { defineConfig } from 'vitepress'
import { en } from './en'
import { zh } from './zh'

export default defineConfig({
  title: 'Fetcher',
  description: 'Modern HTTP Client Ecosystem with Native LLM Streaming Support',
  lastUpdated: true,
  cleanUrls: true,
  srcExclude: ['AGENTS.md', 'CLAUDE.md'],
  sitemap: {
    hostname: 'https://fetcher.ahoo.me',
  },
  ignoreDeadLinks: [
    /localhost/,
  ],
  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/logo.svg' }],
    ['script', { async: '', src: 'https://www.googletagmanager.com/gtag/js?id=G-D1JQFY3LP2' }],
    ['script', {}, 'window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag("js",new Date());gtag("config","G-D1JQFY3LP2");'],
  ],
  themeConfig: {
    search: {
      provider: 'local',
      options: {
        detailedView: true,
        translations: {
          button: {
            buttonText: 'Search',
            buttonAriaLabel: 'Search',
          },
          modal: {
            displayDetails: 'Display detailed list',
            resetButtonTitle: 'Reset search',
            backButtonTitle: 'Back',
            noResultsText: 'No results found',
            footer: {
              selectText: 'to select',
              navigateText: 'to navigate',
              closeText: 'to close',
            },
          },
        },
      },
    },
  },
  locales: {
    root: {
      ...en,
    },
    zh: {
      ...zh,
      themeConfig: {
        ...zh.themeConfig,
        search: {
          provider: 'local',
          options: {
            detailedView: true,
            translations: {
              button: {
                buttonText: '搜索',
                buttonAriaLabel: '搜索文档',
              },
              modal: {
                displayDetails: '显示详情',
                resetButtonTitle: '清除搜索',
                backButtonTitle: '返回',
                noResultsText: '未找到相关结果',
                footer: {
                  selectText: '选择',
                  navigateText: '切换',
                  closeText: '关闭',
                },
              },
            },
          },
        },
      },
    },
  },
  markdown: {
    lineNumbers: true,
  },
  vite: {
    plugins: [],
  },
})
