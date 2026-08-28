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

export function syncSidebarAria(root: ParentNode = document) {
  const currentPath = window.location.pathname.replace(/\/$/, '') || '/';
  const links = root.querySelectorAll<HTMLAnchorElement>(
    '.VPSidebarItem a.link',
  );

  links.forEach(link => {
    const item = link.closest('.VPSidebarItem');
    const linkPath = new URL(link.href, window.location.href).pathname;
    const active =
      link.classList.contains('active') ||
      item?.classList.contains('is-active') ||
      (linkPath.replace(/\/$/, '') || '/') === currentPath;

    if (active) {
      link.setAttribute('aria-current', 'page');
    } else {
      link.removeAttribute('aria-current');
    }
  });

  root
    .querySelectorAll<HTMLElement>('.VPSidebarItem [role="button"]')
    .forEach(control => {
      const item = control.closest('.VPSidebarItem');
      if (!item?.querySelector('.caret')) {
        control.removeAttribute('role');
        control.removeAttribute('tabindex');
        control.removeAttribute('aria-expanded');
        return;
      }
      control.setAttribute(
        'aria-expanded',
        String(!item?.classList.contains('collapsed')),
      );
    });
}

export function observeSidebarAria(root: ParentNode = document) {
  const target = root === document ? document.body : (root as Node);
  if (!target) return () => {};

  syncSidebarAria(root);
  const observer = new MutationObserver(() => syncSidebarAria(root));
  observer.observe(target, {
    attributes: true,
    attributeFilter: ['class'],
    childList: true,
    subtree: true,
  });

  return () => observer.disconnect();
}
