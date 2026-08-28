import type { DefaultTheme } from 'vitepress';

const sidebarSections = [
  {
    text: 'Start',
    items: [
      { text: 'Overview', link: '/start/' },
      { text: 'Installation', link: '/start/installation' },
      { text: 'First Request', link: '/start/first-request' },
      { text: 'Choose Packages', link: '/start/choose-packages' },
    ],
  },
  {
    text: 'Learn',
    items: [
      { text: 'Request Lifecycle', link: '/learn/request-lifecycle' },
      { text: 'Requests and Results', link: '/learn/requests-and-results' },
      {
        text: 'Interceptors, Errors, and Timeouts',
        link: '/learn/interceptors-errors-timeouts',
      },
      { text: 'Streaming', link: '/learn/streaming' },
      { text: 'React Data Flow', link: '/learn/react-data-flow' },
    ],
  },
  {
    text: 'Recipes',
    items: [
      { text: 'Declarative Services', link: '/recipes/declarative-services' },
      { text: 'Generate a Client', link: '/recipes/openapi-client' },
      { text: 'OpenAI Streaming', link: '/recipes/openai-streaming' },
      { text: 'Wow CQRS', link: '/recipes/wow-cqrs' },
      {
        text: 'CoSec Authentication',
        link: '/recipes/cosec-authentication',
      },
      { text: 'State and Events', link: '/recipes/state-and-events' },
      { text: 'Data Viewer', link: '/recipes/data-viewer' },
    ],
  },
  {
    text: 'Skills',
    items: [
      { text: 'Overview', link: '/skills/' },
      { text: 'HTTP and Services', link: '/skills/http-and-services' },
      { text: 'Streaming and OpenAI', link: '/skills/streaming-and-openai' },
      {
        text: 'OpenAPI and Generation',
        link: '/skills/openapi-and-generation',
      },
      {
        text: 'React and Integrations',
        link: '/skills/react-and-integrations',
      },
    ],
  },
  {
    text: 'Reference',
    items: [
      { text: 'Packages', link: '/reference/' },
      { text: 'Fetcher', link: '/reference/fetcher' },
      { text: 'Decorator', link: '/reference/decorator' },
      { text: 'Event Bus', link: '/reference/eventbus' },
      { text: 'Event Stream', link: '/reference/eventstream' },
      { text: 'Storage', link: '/reference/storage' },
      { text: 'React', link: '/reference/react' },
      { text: 'OpenAPI', link: '/reference/openapi' },
      { text: 'Generator', link: '/reference/generator' },
      { text: 'OpenAI', link: '/reference/openai' },
      { text: 'Wow', link: '/reference/wow' },
      { text: 'CoSec', link: '/reference/cosec' },
      { text: 'Viewer', link: '/reference/viewer' },
    ],
  },
  {
    text: 'Contributing',
    items: [
      { text: 'Overview', link: '/contributing/' },
      { text: 'Development', link: '/contributing/development' },
      { text: 'Testing', link: '/contributing/testing' },
      { text: 'Documentation', link: '/contributing/documentation' },
    ],
  },
] satisfies DefaultTheme.SidebarItem[];

function sidebar(activeSection: string) {
  return sidebarSections.map(section =>
    section.text === activeSection
      ? section
      : { text: section.text, link: section.items?.[0]?.link },
  );
}

export const en: DefaultTheme.Config = {
  label: 'English',
  lang: 'en',
  title: 'Fetcher',
  description: 'Typed HTTP clients, streaming, React hooks, and data viewers',
  themeConfig: {
    logo: { src: '/fetcher-logo.png', alt: 'Fetcher logo' },
    nav: [
      { text: 'Start', link: '/start/' },
      { text: 'Learn', link: '/learn/request-lifecycle' },
      { text: 'Recipes', link: '/recipes/declarative-services' },
      { text: 'Skills', link: '/skills/' },
      { text: 'Reference', link: '/reference/' },
      { text: 'Contributing', link: '/contributing/' },
      { text: 'Storybook', link: '/storybook/', target: '_blank' },
    ],
    sidebar: {
      '/start/': sidebar('Start'),
      '/learn/': sidebar('Learn'),
      '/recipes/': sidebar('Recipes'),
      '/skills/': sidebar('Skills'),
      '/reference/': sidebar('Reference'),
      '/contributing/': sidebar('Contributing'),
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
    outline: { level: [2, 3], label: 'On this page' },
  },
};
