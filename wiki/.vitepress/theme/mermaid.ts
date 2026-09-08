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

/** Adapt the renderer's existing dialog and wheel controls for document reading. */
export function observeMermaidInteractions() {
  let active: HTMLElement | null = null;
  let trigger: HTMLElement | null = null;
  let overflow = '';
  const sources = new WeakMap<Element, string>();
  const isChinese = () => document.documentElement.lang.startsWith('zh');
  const visibleButtons = (root: HTMLElement) =>
    [...root.querySelectorAll<HTMLButtonElement>('button')].filter(
      button => button.getClientRects().length && !button.disabled,
    );
  const close = () =>
    active
      ?.querySelector<HTMLButtonElement>('button[data-mermaid-close]')
      ?.click();
  const restore = () => {
    if (!active) return;
    active
      .querySelectorAll<HTMLButtonElement>('[data-mermaid-close]')
      .forEach(button => {
        const label = isChinese() ? '展开图表' : 'Expand diagram';
        button.setAttribute('aria-label', label);
        button.title = label;
        delete button.dataset.mermaidClose;
      });
    active.removeAttribute('role');
    active.removeAttribute('aria-modal');
    document.body.style.overflow = overflow;
    active = null;
    if (trigger?.isConnected) trigger.focus();
  };
  const sync = () => {
    document
      .querySelectorAll<HTMLElement>('.language-mermaid')
      .forEach(block => {
        const code = block.querySelector('pre code');
        if (code && !sources.has(block))
          sources.set(block, code.textContent ?? '');
        if (
          block.querySelector('.diagram-error') &&
          !block.querySelector('.mermaid-source') &&
          sources.has(block)
        ) {
          const details = document.createElement('details');
          details.className = 'mermaid-source';
          const summary = document.createElement('summary');
          summary.textContent = isChinese()
            ? '查看图表源码'
            : 'View diagram source';
          const pre = document.createElement('pre');
          pre.textContent = sources.get(block)!;
          details.append(summary, pre);
          block.append(details);
        }
      });
    document.querySelectorAll<SVGSVGElement>('.mermaid > svg').forEach(svg => {
      const chart = svg.closest<HTMLElement>('.mermaid-container');
      const { width, height } = svg.viewBox.baseVal;
      if (chart && width > 0 && height > 0) {
        const ratio = `${width} / ${height}`;
        if (chart.style.getPropertyValue('--fetcher-mermaid-ratio') !== ratio) {
          chart.style.setProperty('--fetcher-mermaid-ratio', ratio);
        }
      }
    });
    const dialog = document.querySelector<HTMLElement>(
      '.dialog-fullscreen-active',
    );
    if (dialog === active) return;
    restore();
    if (!dialog) return;
    trigger =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    active = dialog;
    overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'true');
    dialog.setAttribute(
      'aria-label',
      document.documentElement.lang.startsWith('zh')
        ? '展开图表'
        : 'Expanded diagram',
    );
    dialog
      .querySelectorAll<HTMLButtonElement>(
        'button[aria-label="Expand diagram"], button[aria-label="展开图表"]',
      )
      .forEach(button => {
        const label = isChinese() ? '关闭图表' : 'Close diagram';
        button.dataset.mermaidClose = '';
        button.setAttribute('aria-label', label);
        button.title = label;
      });
    visibleButtons(dialog)[0]?.focus();
  };
  const keydown = (event: KeyboardEvent) => {
    if (!active) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopImmediatePropagation();
      close();
    } else if (event.key === 'Tab') {
      const buttons = visibleButtons(active);
      const index = buttons.indexOf(
        document.activeElement as HTMLButtonElement,
      );
      if (!buttons.length) return;
      if (
        index < 0 ||
        (event.shiftKey ? index === 0 : index === buttons.length - 1)
      ) {
        event.preventDefault();
        buttons[event.shiftKey ? buttons.length - 1 : 0].focus();
      }
    } else if (
      event.key === '/' ||
      ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k')
    ) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  };
  const wheel = (event: WheelEvent) => {
    const chart = (event.target as Element)?.closest?.('.mermaid-container');
    if (!chart) return;
    // The plugin zooms every wheel in expanded mode; preserve ordinary scrolling.
    if (!event.ctrlKey && !event.metaKey) {
      event.stopPropagation();
      return;
    }
    event.preventDefault();
    if (event.metaKey && !event.ctrlKey) {
      event.stopPropagation();
      event.target?.dispatchEvent(
        new WheelEvent('wheel', {
          bubbles: true,
          cancelable: true,
          ctrlKey: true,
          deltaY: event.deltaY,
          clientX: event.clientX,
          clientY: event.clientY,
        }),
      );
    }
  };
  const click = (event: MouseEvent) => {
    if (active && event.target === active) close();
  };
  const observer = new MutationObserver(sync);
  observer.observe(document.body, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ['class'],
  });
  document.addEventListener('keydown', keydown, true);
  document.addEventListener('wheel', wheel, { capture: true, passive: false });
  document.addEventListener('click', click);
  sync();
  return () => {
    observer.disconnect();
    document.removeEventListener('keydown', keydown, true);
    document.removeEventListener('wheel', wheel, true);
    document.removeEventListener('click', click);
    restore();
  };
}
