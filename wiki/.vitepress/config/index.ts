import { defineConfig } from 'vitepress';
import { referencePackages } from './reference.mjs';
import { en } from './en';
import { zh } from './zh';

export default defineConfig({
  title: 'Fetcher',
  description:
    'Typed HTTP requests, streams, services, and React data workflows',
  lastUpdated: true,
  cleanUrls: true,
  rewrites: Object.fromEntries(referencePackages.flatMap(({ name }) =>
    ['', 'zh/'].map(prefix => [`${prefix}reference/${name}.md`, `${prefix}reference/${name}/migration.md`])
  )),
  srcExclude: ['AGENTS.md', 'CLAUDE.md'],
  sitemap: {
    hostname: 'https://fetcher.ahoo.me',
    transformItems: items =>
      items.filter(
        item =>
          !referencePackages.some(({ name }) =>
            [
              `reference/${name}`,
              `reference/${name}.html`,
              `reference/${name}/migration`,
              `reference/${name}/migration.html`,
              `zh/reference/${name}`,
              `zh/reference/${name}.html`,
              `zh/reference/${name}/migration`,
              `zh/reference/${name}/migration.html`,
            ].includes(item.url.replace(/^\//, '')),
          ),
      ),
  },
  ignoreDeadLinks: [/localhost/],
  head: [
    ['link', { rel: 'icon', type: 'image/png', href: '/fetcher-logo.png' }],
    [
      'script',
      {
        async: '',
        src: 'https://www.googletagmanager.com/gtag/js?id=G-D1JQFY3LP2',
      },
    ],
    [
      'script',
      {},
      'window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag("js",new Date());gtag("config","G-D1JQFY3LP2");',
    ],
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
});
