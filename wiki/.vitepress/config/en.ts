import { siteSidebar } from './reference';
import type { DefaultTheme, LocaleConfig } from 'vitepress';

export const en: LocaleConfig<DefaultTheme.Config>[string] = {
  label: 'English',
  lang: 'en',
  title: 'Fetcher',
  description: 'Typed HTTP clients, streaming, React hooks, and data viewers',
  themeConfig: {
    logo: { src: '/fetcher-logo.png', alt: 'Fetcher logo' },
    nav: [
      { text: 'Start', link: '/start/' },
      { text: 'Guides', link: '/guides/' },
      { text: 'Architecture', link: '/architecture/' },
      { text: 'Reference', link: '/reference/' },
      {
        text: 'Resources',
        items: [
          { text: 'Examples', link: '/examples/' },
          { text: 'Skills', link: '/skills/' },
          { text: 'Contributing', link: '/contributing/' },
          { text: 'GitHub', link: 'https://github.com/Ahoo-Wang/fetcher' },
        ],
      },
      { text: 'Storybook', link: '/storybook/', target: '_blank' },
    ],
    sidebar: siteSidebar(false),
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
    outline: { level: [2, 3], label: 'On this page' },
  },
};
