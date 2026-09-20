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

import { useLayoutEffect, useState, type RefObject } from 'react';
import { Maximize2Icon, Minimize2Icon } from 'lucide-react';
import { Button } from './components/button.js';
import { useViewMessages } from './MessagesProvider.js';

/** Whether a surface fills the screen, and the one way to change it. */
export interface ViewExpansion {
  expanded: boolean;
  toggle(): void;
}

/**
 * What one document owes when its expanded surfaces go away.
 *
 * Two surfaces can be expanded on one page — a dashboard panel's workbench
 * and an embedded view beside it — and both want the background still. A
 * count rather than a boolean is what makes the second one closing put the
 * page back the way the first one found it, and never before: a plain
 * "restore on close" leaves the body locked for as long as the other one is
 * open, or unlocks it while it is.
 *
 * The previous value is kept with its priority, because a host that wrote
 * `overflow: auto !important` meant it, and handing back a plain `auto`
 * would be a different page from the one we borrowed.
 */
const scrollLocks = new WeakMap<
  Document,
  { count: number; overflow: string; priority: string }
>();

/**
 * Anything that owns the Escape key while it is open. A dialog, a menu and a
 * listbox all close on Escape, and the one in front has the first claim: a
 * user pressing it over an open field picker means "close the picker", never
 * "put the whole view back in the page".
 */
const ABOVE =
  '[role="dialog"], [role="alertdialog"], [role="menu"], [role="listbox"]';

/**
 * Let a surface fill the screen **where it stands**.
 *
 * Expanding in place rather than portalling is the whole decision. A portal
 * re-parents the subtree, React unmounts and remounts everything under it,
 * and the draft the user is looking at — the half-typed condition, the
 * selection, the open popup — is gone. So nothing moves: the element the ref
 * points at is marked `data-view-expanded`, and one unlayered rule in
 * `styles.css` pins it to the viewport.
 *
 * It is **not a modal**, and says so by omission: no `aria-modal`, no focus
 * trap, no `inert` anywhere. Nothing is being asked and there is nothing to
 * answer — this is the same content it was a moment ago, in the same place,
 * with the same focus. Claiming modality would tell a screen reader that the
 * host's page is unavailable, which is a promise about content we are in no
 * position to make: the expanded element is still a descendant of the host's
 * own DOM, and making "everything else" inert would mean walking up and
 * inerting a sibling at every level — which is a portal's job, and a portal
 * is what costs the draft.
 *
 * What it does borrow from a modal is the one thing a full-viewport surface
 * genuinely needs: the background does not scroll underneath it, because a
 * scroll whose effect nobody can see is a scroll position silently lost. And
 * Escape closes it, unless the key belongs to something in front.
 *
 * @param target the surface to expand; an `.fve-root`, or an element inside
 *   one — the stylesheet paints nothing outside the root
 * @param toggleRef the control that opened it, which focus goes back to
 * @param enabled false while there is nothing to expand, which also releases
 *   an expansion already in force
 */
export function useViewExpansion(
  target: RefObject<HTMLElement | null>,
  toggleRef: RefObject<HTMLElement | null>,
  enabled = true,
): ViewExpansion {
  const [expanded, setExpanded] = useState(false);
  useLayoutEffect(() => {
    const element = target.current;
    if (!expanded || !enabled || !element) return;
    // The element's own document, not the global one: an expanded surface
    // inside an iframe locks the frame it is in, and the two counts never
    // meet.
    const doc = element.ownerDocument;
    const style = doc.body.style;
    const lock = scrollLocks.get(doc) ?? {
      count: 0,
      overflow: style.getPropertyValue('overflow'),
      priority: style.getPropertyPriority('overflow'),
    };
    if (lock.count === 0) {
      scrollLocks.set(doc, lock);
      style.setProperty('overflow', 'hidden');
    }
    lock.count += 1;
    element.setAttribute('data-view-expanded', 'true');

    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Escape' || event.defaultPrevented) return;
      // Two ways something in front can claim the key: focus is inside it,
      // or focus is still on the trigger that opened it — Base UI marks such
      // a trigger `data-popup-open`, which is the same tell `FilterPanel`
      // reads before it treats Enter as a submit.
      if (
        event.target instanceof Element &&
        (event.target.closest(ABOVE) !== null ||
          event.target.closest('[data-popup-open]') !== null)
      )
        return;
      setExpanded(false);
      // Back to the control that opened it. Collapsing by clicking it needs
      // no help — nothing remounted, so focus never left — but a key pressed
      // anywhere in a surface that covers the screen would otherwise drop
      // focus on the body and start the page again from the top.
      toggleRef.current?.focus();
    }
    doc.addEventListener('keydown', onKeyDown);

    return () => {
      element.removeAttribute('data-view-expanded');
      lock.count -= 1;
      if (lock.count === 0) {
        // Exactly what was there, priority included; then forget it, so the
        // next expansion reads the page as it is then rather than as it was.
        style.setProperty('overflow', lock.overflow, lock.priority);
        scrollLocks.delete(doc);
      }
      doc.removeEventListener('keydown', onKeyDown);
    };
  }, [target, toggleRef, expanded, enabled]);

  return {
    expanded: enabled && expanded,
    toggle: () => setExpanded(value => !value),
  };
}

export interface ViewExpandToggleProps {
  expansion: ViewExpansion;
  ref?: RefObject<HTMLButtonElement | null>;
}

/**
 * The control that fills the screen with this view, in the title bar's
 * right-hand group: it is one of the answers to *how am I looking at this*,
 * beside the editor's fold and before whatever the host adds.
 *
 * `aria-expanded` rather than `aria-pressed`, which is what the legacy
 * button wore: the surface it governs is a region that grows and shrinks,
 * the same relationship the sidebar's and the editor's toggles already
 * describe, and one page should not name that relationship two ways.
 * `aria-keyshortcuts` is how the Escape route is discoverable without
 * spending a tooltip on it — and it is announced only while there is
 * something for the key to do.
 */
export function ViewExpandToggle({ expansion, ref }: ViewExpandToggleProps) {
  const messages = useViewMessages();
  const { expanded } = expansion;
  const label = messages.label(
    expanded ? 'label.workbench.collapse-view' : 'label.workbench.expand-view',
  );
  return (
    <Button
      ref={ref}
      data-slot="view-expand"
      variant="outline"
      size="icon-sm"
      aria-label={label}
      aria-expanded={expanded}
      aria-keyshortcuts={expanded ? 'Escape' : undefined}
      onClick={expansion.toggle}
    >
      {expanded ? <Minimize2Icon /> : <Maximize2Icon />}
    </Button>
  );
}
