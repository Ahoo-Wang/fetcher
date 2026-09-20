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
 * What one document owes while surfaces are expanded on it.
 *
 * Two can be open at once — a dashboard panel's workbench and an embedded
 * view beside it — and both want the background still. `open` is the stack of
 * them, oldest first, which answers two questions with one structure: whether
 * the page is still owed its scrolling (any at all), and which expansion the
 * Escape key belongs to (the last one, the one in front).
 *
 * The previous value is kept with its priority, because a host that wrote
 * `overflow: auto !important` meant it, and handing back a plain `auto`
 * would be a different page from the one we borrowed.
 */
interface DocumentLock {
  open: object[];
  overflow: string;
  priority: string;
}

const scrollLocks = new WeakMap<Document, DocumentLock>();

/**
 * Anything that owns the Escape key while it is open. A dialog, a menu and a
 * listbox all close on Escape, and the one in front has the first claim: a
 * user pressing it over an open field picker means "close the picker", never
 * "put the whole view back in the page".
 */
const ABOVE =
  '[role="dialog"], [role="alertdialog"], [role="menu"], [role="listbox"]';

/** The geometry the stylesheet reads; absent means "the viewport itself". */
const FITTED = [
  '--fve-expanded-x',
  '--fve-expanded-y',
  '--fve-expanded-w',
  '--fve-expanded-h',
] as const;

/**
 * The surface an element belongs to.
 *
 * The stylesheet expands `.fve-root` and nothing else — every rule in this
 * package is pinned to that boundary — so pointing this at something inside
 * a view has to mean "expand the view it is in", not "write an attribute
 * that paints nothing while the page sits locked behind it".
 */
function surfaceOf(node: HTMLElement | null): HTMLElement | null {
  return node?.closest<HTMLElement>('.fve-root') ?? node;
}

/**
 * Put the surface on the viewport, whatever its ancestors did.
 *
 * `position: fixed` resolves against the viewport only while no ancestor has
 * made itself the containing block, and `transform`, `filter`, `perspective`,
 * `backdrop-filter`, `will-change`, `contain` and `container-type` all do —
 * which is to say every animated wrapper and most grid shells. Enumerating
 * them is a list that goes stale with the next CSS module, so this measures
 * the box the browser actually gave us instead: if it is not the viewport,
 * the difference *is* the correction, and one pass is exact.
 *
 * It corrects the geometry, which is what a host notices. An ancestor that
 * also *clips* (`overflow: hidden`, `contain: paint`) still clips, and one
 * that raises its own stacking context above the portalled popups still
 * covers them — no rendering that stays in place can escape either, and
 * leaving in place is the decision this whole feature is built on.
 */
function fitToViewport(element: HTMLElement, view: Window): void {
  const style = element.style;
  for (const name of FITTED) style.removeProperty(name);
  const box = element.getBoundingClientRect();
  // No layout engine (jsdom) has nothing to correct, and neither has a box
  // that already covers the viewport.
  if (box.width === 0 && box.height === 0) return;
  const off = (a: number, b: number) => Math.abs(a - b) >= 0.5;
  if (
    !off(box.left, 0) &&
    !off(box.top, 0) &&
    !off(box.width, view.innerWidth) &&
    !off(box.height, view.innerHeight)
  )
    return;
  style.setProperty('--fve-expanded-x', `${-box.left}px`);
  style.setProperty('--fve-expanded-y', `${-box.top}px`);
  style.setProperty('--fve-expanded-w', `${view.innerWidth}px`);
  style.setProperty('--fve-expanded-h', `${view.innerHeight}px`);
}

/**
 * Let a surface fill the screen **where it stands**.
 *
 * Expanding in place rather than portalling is the whole decision. A portal
 * re-parents the subtree, React recreates every node under it, and focus, the
 * scroll position and a half-finished IME composition go with them — and the
 * surface loses the host ancestor whose `.dark` class it was following.
 * Nothing moves instead: the `.fve-root` at or above the element the ref
 * points at is marked `data-view-expanded`, and one unlayered rule in
 * `styles.css` pins it to the viewport.
 *
 * The top layer — `requestFullscreen()`, or `popover="manual"` — would solve
 * the containing-block problem outright and was rejected for one reason:
 * every popup this package opens is portalled to `document.body`, so the
 * field picker, the filter menus, the save split button and the view switcher
 * would all render *behind* the expanded view, or under fullscreen not render
 * at all. A view you cannot open a menu in is not an expanded view.
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
 * @param target the surface to expand, or anything inside one
 * @param toggleRef the control that opened it, which focus goes back to
 * @param enabled false while there is nothing to expand, which also ends an
 *   expansion already in force rather than holding it for later
 */
export function useViewExpansion(
  target: RefObject<HTMLElement | null>,
  toggleRef: RefObject<HTMLElement | null>,
  enabled = true,
): ViewExpansion {
  const [expanded, setExpanded] = useState(false);
  // Losing the control ends the expansion rather than parking it: reporting
  // `expanded: false` while still holding it would fill the screen again the
  // moment the control came back, a view taking over the page with nobody
  // having asked for it. Adjusted here, while rendering, rather than in an
  // effect — React drops this render and redoes it before anything is shown,
  // so the surface is never briefly expanded with no way out of it.
  const [was, setWas] = useState(enabled);
  if (was !== enabled) {
    setWas(enabled);
    if (!enabled) setExpanded(false);
  }
  const on = enabled && expanded;

  useLayoutEffect(() => {
    const element = on ? surfaceOf(target.current) : null;
    if (!element) return;
    // The element's own document, not the global one: an expanded surface
    // inside an iframe locks the frame it is in, and the two stacks never
    // meet.
    const doc = element.ownerDocument;
    const view = doc.defaultView;
    const style = doc.body.style;
    const lock = scrollLocks.get(doc) ?? {
      open: [],
      overflow: style.getPropertyValue('overflow'),
      priority: style.getPropertyPriority('overflow'),
    };
    if (lock.open.length === 0) {
      scrollLocks.set(doc, lock);
      // Important, because the page we are borrowing may well be holding its
      // own `overflow` that way — a host stylesheet's `!important` outranks a
      // plain inline declaration, and the background would go on scrolling
      // under a surface that covers it.
      style.setProperty('overflow', 'hidden', 'important');
    }
    // This expansion's place in the stack, and its identity in it.
    const handle = {};
    lock.open.push(handle);
    element.setAttribute('data-view-expanded', 'true');

    const fit = view ? () => fitToViewport(element, view) : null;
    fit?.();
    view?.addEventListener('resize', fit!);

    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Escape' || event.defaultPrevented) return;
      // Only the surface in front answers. Every expansion listens on the
      // same document, so without this one Escape would collapse all of them
      // at once and leave two of them fighting over where focus lands.
      if (lock.open[lock.open.length - 1] !== handle) return;
      // Two ways something in front can claim the key: focus is inside it,
      // or focus is still on the trigger that opened it — Base UI marks such
      // a trigger `data-popup-open`, which is the same tell `FilterPanel`
      // reads before it treats Enter as a submit. The constructor comes from
      // the event's own document: in an iframe, `instanceof Element` against
      // the top window's realm is false, and the check would be skipped for
      // exactly the surfaces most likely to be embedded.
      const node = event.target;
      if (
        view &&
        node instanceof view.Element &&
        (node.closest(ABOVE) !== null ||
          node.closest('[data-popup-open]') !== null)
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
      for (const name of FITTED) element.style.removeProperty(name);
      if (fit) view?.removeEventListener('resize', fit);
      const at = lock.open.indexOf(handle);
      if (at >= 0) lock.open.splice(at, 1);
      if (lock.open.length === 0) {
        // Exactly what was there, priority included; then forget it, so the
        // next expansion reads the page as it is then rather than as it was.
        style.setProperty('overflow', lock.overflow, lock.priority);
        scrollLocks.delete(doc);
      }
      doc.removeEventListener('keydown', onKeyDown);
    };
  }, [target, toggleRef, on]);

  return { expanded: on, toggle: () => setExpanded(value => !value) };
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
