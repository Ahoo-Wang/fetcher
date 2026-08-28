import DefaultTheme from 'vitepress/theme';
import type { Theme } from 'vitepress';
import { defineComponent, h, onBeforeUnmount, onMounted } from 'vue';
import './custom.css';
import { observeSidebarAria } from './sidebarA11y';

const hasSetup = Symbol('mermaid-setup');

export default {
  extends: DefaultTheme,
  Layout: defineComponent({
    name: 'FetcherThemeLayout',
    setup() {
      let stopSidebarAria = () => {};

      onMounted(() => {
        stopSidebarAria = observeSidebarAria();
      });
      onBeforeUnmount(() => stopSidebarAria());

      if (typeof window !== 'undefined' && !(window as any)[hasSetup]) {
        (window as any)[hasSetup] = true;
        import('vitepress-mermaid-renderer').then(
          ({ createMermaidRenderer }) => {
            const isDark = document.documentElement.classList.contains('dark');
            createMermaidRenderer({
              theme: isDark ? 'dark' : 'default',
              startOnLoad: true,
              flowchart: {
                useMaxWidth: true,
                htmlLabels: true,
                curve: 'basis',
              },
              sequence: {
                useMaxWidth: true,
                diagramMarginX: 50,
                diagramMarginY: 10,
              },
              classDiagram: { useMaxWidth: true },
              stateDiagram: { useMaxWidth: true },
              er: { useMaxWidth: true },
              gantt: { useMaxWidth: true },
              pie: { useMaxWidth: true },
              journey: { useMaxWidth: true },
              gitGraph: { useMaxWidth: true },
              mindmap: { useMaxWidth: true },
              quadrantChart: { useMaxWidth: true },
              themeVariables: {
                primaryColor: '#2d333b',
                primaryTextColor: '#e6edf3',
                primaryBorderColor: '#6d5dfc',
                lineColor: '#8b949e',
                secondaryColor: '#161b22',
                tertiaryColor: '#21262d',
                fontFamily: 'Inter, sans-serif',
                fontSize: '14px',
              },
            });
          },
        );
      }

      return () => h(DefaultTheme.Layout);
    },
  }),
} satisfies Theme;
