import { siteSidebar } from './reference';
import type { DefaultTheme, LocaleConfig } from 'vitepress';

export const zh: LocaleConfig<DefaultTheme.Config>[string] = {
  label: '中文',
  lang: 'zh-CN',
  title: 'Fetcher',
  description: '类型化 HTTP 客户端、流式响应、React Hooks 与数据 Viewer',
  themeConfig: {
    sidebarMenuLabel: '目录',
    returnToTopLabel: '返回顶部',
    logo: { src: '/fetcher-logo.png', alt: 'Fetcher 标志' },
    nav: [
      { text: '开始', link: '/zh/start/' },
      { text: '指南', link: '/zh/guides/' },
      { text: '架构', link: '/zh/architecture/' },
      { text: '参考', link: '/zh/reference/' },
      {
        text: '资源',
        items: [
          { text: '示例', link: '/zh/examples/' },
          { text: 'Skills', link: '/zh/skills/' },
          { text: '贡献', link: '/zh/contributing/' },
          { text: 'GitHub', link: 'https://github.com/Ahoo-Wang/fetcher' },
        ],
      },
    ],
    sidebar: siteSidebar(true),
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
    outline: { level: [2, 3], label: '页面导航' },
    lastUpdated: { text: '最后更新于' },
    docFooter: { prev: '上一页', next: '下一页' },
  },
};
