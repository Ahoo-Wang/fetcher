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

import {
  createContext,
  useLayoutEffect,
  useState,
  type RefObject,
} from 'react';

type ViewExpansion = { expanded: boolean; toggle(): void };
export const ViewExpansionContext = createContext<ViewExpansion | null>(null);

/** Expand in place so editors, selection, navigation and portal content keep their owners. */
export function useViewExpansion(
  target: RefObject<HTMLElement | null>,
  enabled = true,
): ViewExpansion {
  const [expanded, setExpanded] = useState(false);
  useLayoutEffect(() => {
    const element = target.current;
    if (!expanded || !enabled || !element) return;
    const doc = element.ownerDocument;
    const previousOverflow = doc.body.style.overflow;
    element.setAttribute('data-view-expanded', 'true');
    doc.body.style.setProperty('overflow', 'hidden');
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Escape' || event.defaultPrevented) return;
      if (
        event.target instanceof Element &&
        event.target.closest(
          '[role="dialog"], [role="alertdialog"], [role="menu"], [role="listbox"]',
        )
      )
        return;
      setExpanded(false);
      element
        ?.querySelector<HTMLButtonElement>('[data-slot="view-expand"]')
        ?.focus();
    }
    doc.addEventListener('keydown', onKeyDown);
    return () => {
      element.removeAttribute('data-view-expanded');
      doc.body.style.setProperty('overflow', previousOverflow);
      doc.removeEventListener('keydown', onKeyDown);
    };
  }, [target, expanded, enabled]);
  return {
    expanded: enabled && expanded,
    toggle: () => setExpanded(value => !value),
  };
}
