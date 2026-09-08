/*
 * Copyright [2021-present] [ahoo wang <ahoowang@qq.com> (https://github.com/Ahoo-Wang)].
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *      http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import DefaultTheme from 'vitepress/theme';
import { useData, type Theme } from 'vitepress';
import { defineComponent, h, onBeforeUnmount, onMounted, watch } from 'vue';
import type {
  MermaidRenderer,
  MermaidToolbarOptions,
} from 'vitepress-mermaid-renderer';
import './custom.css';
import { observeSidebarAria } from './sidebarA11y';
import { observeMermaidInteractions } from './mermaid';
import { mermaidConfig } from '../config/mermaid';

export default {
  extends: DefaultTheme,
  Layout: defineComponent({
    name: 'FetcherThemeLayout',
    setup() {
      const { isDark, lang } = useData();
      let stop = () => {};
      let renderer: MermaidRenderer | undefined;
      let refreshRenderer = () => {};
      let disposed = false;
      const configure = () => {
        const mode = {
          zoomIn: 'enabled',
          zoomOut: 'enabled',
          resetView: 'enabled',
          toggleFullscreen: 'enabled',
          copyCode: 'disabled',
          download: 'disabled',
          toggleToolbar: 'disabled',
          collapsed: 'expanded',
          zoomLevel: 'disabled',
        } as const;
        const zh = lang.value.startsWith('zh');
        const toolbar: MermaidToolbarOptions = {
          fullscreenMode: 'dialog',
          showLanguageLabel: false,
          desktop: mode,
          mobile: mode,
          fullscreen: mode,
          i18n: {
            tooltips: {
              zoomIn: zh ? '放大' : 'Zoom in',
              zoomOut: zh ? '缩小' : 'Zoom out',
              resetView: zh ? '重置视图' : 'Reset view',
              toggleFullscreen: zh ? '展开图表' : 'Expand diagram',
              renderErrorText: zh ? '图表渲染失败' : 'Unable to render diagram',
              toggleErrorDetailsText: zh
                ? '查看错误详情'
                : 'Show error details',
              toggleErrorDetailsHideText: zh
                ? '隐藏错误详情'
                : 'Hide error details',
            },
          },
        };
        renderer?.setToolbar(toolbar);
      };
      onMounted(async () => {
        const stopSidebar = observeSidebarAria();
        const stopMermaid = observeMermaidInteractions();
        stop = () => {
          stopSidebar();
          stopMermaid();
        };
        const { createMermaidRenderer } =
          await import('vitepress-mermaid-renderer');
        if (disposed) return;
        refreshRenderer = () => {
          renderer = createMermaidRenderer({
            ...mermaidConfig,
            theme: 'dark',
            startOnLoad: true,
          });
          configure();
        };
        refreshRenderer();
      });
      watch([isDark, lang], () => refreshRenderer());
      onBeforeUnmount(() => {
        disposed = true;
        stop();
      });
      return () => h(DefaultTheme.Layout);
    },
  }),
} satisfies Theme;
