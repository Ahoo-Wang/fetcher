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

import { StrictMode, useRef } from 'react';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { MemoryViewStore, ViewEngine } from '../src/index.js';
import type { ViewInstance, ViewSource } from '../src/index.js';
import { useWorkbench } from '../src/react/index.js';
import {
  AnalysisWorkbench,
  defaultMessages,
  EmbeddedView,
  RecordWorkbench,
  useViewExpansion,
  WorkbenchShell,
  zhCN,
} from '../src/ui/index.js';
import {
  analysisConfig,
  deferred,
  ordersDefinition,
  recordConfig,
  testSource,
  ROWS,
} from './fixtures.js';

afterEach(() => {
  cleanup();
  // The lock is the one thing this suite can leave behind for the next one,
  // which is exactly the failure it exists to catch — so it is cleared here
  // rather than trusted, and asserted on inside every test that takes it.
  document.body.style.removeProperty('overflow');
});

const FILL = defaultMessages['label.workbench.expand-view'];
const LEAVE = defaultMessages['label.workbench.collapse-view'];
const COLLAPSE_SIDEBAR = defaultMessages['label.workbench.collapse-sidebar'];
const SWITCH = defaultMessages['label.workbench.switch-view'];
const FILTER = new RegExp(defaultMessages['label.filter.panel']);

const mine: ViewInstance = {
  id: 'mine',
  definitionId: 'orders',
  title: 'Mine',
  scope: 'personal',
  revision: '1',
  config: recordConfig(),
};

const byWarehouse: ViewInstance = {
  id: 'by-warehouse',
  definitionId: 'orders',
  title: 'By warehouse',
  scope: 'shared',
  revision: '1',
  config: analysisConfig(),
};

function engineWith(source: ViewSource = testSource()): ViewEngine {
  return new ViewEngine({
    definitions: [ordersDefinition()],
    store: new MemoryViewStore({ instances: [mine, byWarehouse] }),
    resolveSource: () => source,
  });
}

/** The record workbench, opened on a saved view with rows on screen. */
async function open(engine = engineWith()) {
  const user = userEvent.setup();
  render(
    <RecordWorkbench engine={engine} definitionId="orders" instanceId="mine" />,
  );
  await screen.findByRole('table');
  return user;
}

/** The workbench, opened and already filling the screen. */
async function expanded(engine = engineWith()) {
  const user = await open(engine);
  await user.click(screen.getByRole('button', { name: FILL }));
  return user;
}

const surface = () =>
  document.querySelector<HTMLElement>('[data-slot="view-surface"]')!;
const isExpanded = () =>
  surface().getAttribute('data-view-expanded') === 'true';

describe('the control that fills the screen', () => {
  it('sits in the title bar with the other controls for how a view is read', async () => {
    await open();

    const controls = document.querySelector<HTMLElement>(
      '[data-slot="view-controls"]',
    )!;
    const toggle = screen.getByRole('button', { name: FILL });
    expect(controls.contains(toggle)).toBe(true);
    // The editor's fold governs what the view asks; this governs the room
    // the answer gets. They read outwards, in that order.
    const order = [
      ...controls.querySelectorAll(
        '[data-slot="editor-toggle"], [data-slot="view-expand"]',
      ),
    ].map(node => node.getAttribute('data-slot'));
    expect(order).toEqual(['editor-toggle', 'view-expand']);
  });

  it('says which state it is in, and never says it twice', async () => {
    const user = await open();
    const toggle = screen.getByRole('button', { name: FILL });

    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    // Nothing to press Escape for yet, so nothing is announced about it.
    expect(toggle.hasAttribute('aria-keyshortcuts')).toBe(false);

    await user.click(toggle);
    const back = screen.getByRole('button', { name: LEAVE });
    expect(back).toBe(toggle);
    expect(back.getAttribute('aria-expanded')).toBe('true');
    expect(back.getAttribute('aria-keyshortcuts')).toBe('Escape');
    // One control, two names: a second button for the way back would be a
    // second thing to find for one choice.
    expect(screen.queryByRole('button', { name: FILL })).toBeNull();
  });

  it('marks the surface in place rather than moving it anywhere', async () => {
    const user = await open();
    const before = screen.getByRole('table');
    const parent = surface().parentElement;

    await user.click(screen.getByRole('button', { name: FILL }));

    expect(isExpanded()).toBe(true);
    // The same table node, under the same parent: a portal would have
    // remounted everything under it and taken the draft with it.
    expect(screen.getByRole('table')).toBe(before);
    expect(surface().parentElement).toBe(parent);
  });

  it('speaks the host language, like every other word on the bar', async () => {
    const engine = engineWith();
    render(
      <RecordWorkbench
        engine={engine}
        definitionId="orders"
        instanceId="mine"
        messages={zhCN}
      />,
    );
    await screen.findByRole('table');

    expect(
      screen.getByRole('button', { name: zhCN['label.workbench.expand-view'] }),
    ).toBeDefined();
  });

  it('is not offered where the host says there is no room for it', async () => {
    render(<Shell engine={engineWith()} expandable={false} />);
    await screen.findByText('rows');

    expect(screen.queryByRole('button', { name: FILL })).toBeNull();
    // And the group it would have joined is still the group it was: the
    // editor's fold does not move because its neighbour is absent.
    expect(
      document.querySelector('[data-slot="view-controls"]')!.textContent,
    ).toMatch(FILTER);
  });
});

describe('the background while a view fills the screen', () => {
  it('stops scrolling, and is handed back exactly as it was', async () => {
    document.body.style.setProperty('overflow', 'auto', 'important');
    const user = await open();

    await user.click(screen.getByRole('button', { name: FILL }));
    expect(document.body.style.overflow).toBe('hidden');

    await user.click(screen.getByRole('button', { name: LEAVE }));
    // The priority too: a host that wrote `!important` meant it, and a plain
    // `auto` handed back is a different page from the one we borrowed.
    expect(document.body.style.overflow).toBe('auto');
    expect(document.body.style.getPropertyPriority('overflow')).toBe(
      'important',
    );
  });

  it('leaves nothing behind when the view is unmounted while expanded', async () => {
    document.body.style.setProperty('overflow', 'scroll');
    const user = userEvent.setup();
    const view = render(
      <RecordWorkbench
        engine={engineWith()}
        definitionId="orders"
        instanceId="mine"
      />,
    );
    await screen.findByRole('table');
    await user.click(screen.getByRole('button', { name: FILL }));
    expect(document.body.style.overflow).toBe('hidden');

    // Navigating away is the one close that never runs a click handler, so
    // a lock released only on the button would outlive the page that took it.
    view.unmount();
    expect(document.body.style.overflow).toBe('scroll');
  });

  it('survives the setup React runs twice', async () => {
    document.body.style.setProperty('overflow', 'auto');
    const user = userEvent.setup();
    const view = render(
      <StrictMode>
        <RecordWorkbench
          engine={engineWith()}
          definitionId="orders"
          instanceId="mine"
        />
      </StrictMode>,
    );
    await screen.findByRole('table');

    await user.click(screen.getByRole('button', { name: FILL }));
    // Setup, cleanup, setup: a count that did not come back to one would
    // either unlock under an open surface or never unlock at all.
    expect(document.body.style.overflow).toBe('hidden');
    view.unmount();
    expect(document.body.style.overflow).toBe('auto');
  });

  it('reads the page as it is each time rather than as it once was', async () => {
    document.body.style.setProperty('overflow', 'auto');
    const first = await expanded();
    await first.click(screen.getByRole('button', { name: LEAVE }));

    document.body.style.setProperty('overflow', 'clip', 'important');
    await first.click(screen.getByRole('button', { name: FILL }));
    await first.click(screen.getByRole('button', { name: LEAVE }));

    // The remembered value is dropped with the last lock, so the second
    // expansion restores what the host had by then, not what it had first.
    expect(document.body.style.overflow).toBe('clip');
    expect(document.body.style.getPropertyPriority('overflow')).toBe(
      'important',
    );
  });
});

/**
 * A dashboard panel's workbench and an embedded view can sit on one page, and
 * both of them can fill the screen. Two owners of one document's scrolling is
 * where this kind of feature goes wrong: the first one closing puts the page
 * back under the second, or the second one closing never puts it back at all.
 */
describe('two surfaces on one document', () => {
  /** One workbench in a container of its own, expanded. */
  async function page() {
    const user = userEvent.setup();
    const container = document.body.appendChild(document.createElement('div'));
    const view = render(
      <RecordWorkbench
        engine={engineWith()}
        definitionId="orders"
        instanceId="mine"
      />,
      { container, baseElement: container },
    );
    await view.findByRole('table');
    await user.click(view.getByRole('button', { name: FILL }));
    return { user, view };
  }

  it.each([{ first: 0 }, { first: 1 }])(
    'keeps the page still until the last of them leaves (first out: $first)',
    async ({ first }) => {
      document.body.style.setProperty('overflow', 'auto', 'important');
      const pages = [await page(), await page()];
      expect(document.body.style.overflow).toBe('hidden');

      const closing = pages[first];
      await closing.user.click(
        closing.view.getByRole('button', { name: LEAVE }),
      );
      expect(
        closing.view.container.querySelector('[data-view-expanded]'),
      ).toBeNull();
      // The other one is still on screen and still wants the page still.
      expect(
        pages[1 - first].view.getByRole('button', { name: LEAVE }),
      ).toBeDefined();
      expect(document.body.style.overflow).toBe('hidden');

      const last = pages[1 - first];
      await last.user.click(last.view.getByRole('button', { name: LEAVE }));
      expect(document.body.style.overflow).toBe('auto');
      expect(document.body.style.getPropertyPriority('overflow')).toBe(
        'important',
      );
    },
  );

  it('counts each document on its own', async () => {
    const frame = document.body.appendChild(document.createElement('iframe'));
    const frameDocument = frame.contentDocument!;
    document.body.style.setProperty('overflow', 'auto');
    frameDocument.body.style.setProperty('overflow', 'scroll', 'important');
    try {
      const here = await page();
      const inFrame = render(
        <RecordWorkbench
          engine={engineWith()}
          definitionId="orders"
          instanceId="mine"
        />,
        {
          container: frameDocument.body.appendChild(
            frameDocument.createElement('div'),
          ),
          baseElement: frameDocument.body,
        },
      );
      await inFrame.findByRole('table');
      fireEvent.click(inFrame.getByRole('button', { name: FILL }));

      expect(document.body.style.overflow).toBe('hidden');
      expect(frameDocument.body.style.overflow).toBe('hidden');

      here.view.unmount();
      // One page going back does not reach into the other's.
      expect(document.body.style.overflow).toBe('auto');
      expect(frameDocument.body.style.overflow).toBe('hidden');

      inFrame.unmount();
      expect(frameDocument.body.style.overflow).toBe('scroll');
      expect(frameDocument.body.style.getPropertyPriority('overflow')).toBe(
        'important',
      );
    } finally {
      frame.remove();
    }
  });
});

describe('the keyboard', () => {
  it('reaches the toggle and works it without a pointer', async () => {
    const user = await open();

    screen.getByRole('button', { name: FILL }).focus();
    await user.keyboard('{Enter}');
    expect(isExpanded()).toBe(true);

    await user.keyboard('{Enter}');
    expect(isExpanded()).toBe(false);
  });

  it('puts the view back on Escape, with focus where it started', async () => {
    const user = await expanded();
    // Focus somewhere in the result, the way a reader gets there.
    screen.getAllByRole('columnheader')[1].querySelector('button')?.focus();

    await user.keyboard('{Escape}');

    expect(isExpanded()).toBe(false);
    // Back to the control that opened it: a key pressed inside a surface
    // covering the screen would otherwise drop focus on the body.
    expect(document.activeElement).toBe(
      screen.getByRole('button', { name: FILL }),
    );
  });

  it('leaves the key to a menu that is in front of it', async () => {
    const user = await expanded();
    await user.click(screen.getByRole('button', { name: COLLAPSE_SIDEBAR }));
    await user.click(screen.getByRole('button', { name: SWITCH }));
    await screen.findByRole('menu');

    await user.keyboard('{Escape}');

    await waitFor(() => expect(screen.queryByRole('menu')).toBeNull());
    // The menu took it, and only the menu: "close this" means the thing in
    // front, never the whole view behind it.
    expect(isExpanded()).toBe(true);
    expect(document.body.style.overflow).toBe('hidden');
  });

  it('leaves the key to a dialog that is in front of it', async () => {
    const user = await expanded();
    await user.click(screen.getByRole('button', { name: FILTER }));
    await user.click(
      screen.getByRole('button', { name: defaultMessages['label.filter.add'] }),
    );
    const picker = await screen.findByRole('dialog');
    await user.click(
      within(picker).getByRole('checkbox', { name: 'Warehouse' }),
    );

    await user.keyboard('{Escape}');

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(isExpanded()).toBe(true);
    // And the draft the picker was writing is still there, because nothing
    // was ever re-parented.
    expect(screen.getByRole('button', { name: FILTER }).textContent).toContain(
      '1',
    );
  });

  it('ignores a key something else already answered', async () => {
    await expanded();

    const handled = new KeyboardEvent('keydown', {
      key: 'Escape',
      bubbles: true,
      cancelable: true,
    });
    handled.preventDefault();
    document.dispatchEvent(handled);

    expect(isExpanded()).toBe(true);
  });

  it('is not moved by any other key', async () => {
    await expanded();

    fireEvent.keyDown(document, { key: 'Enter' });
    fireEvent.keyDown(document, { key: 'Backspace' });
    expect(isExpanded()).toBe(true);
  });
});

describe('the states a view can be expanded in', () => {
  it('expands while the first rows are still on their way', async () => {
    const pending = deferred<{ total: number; list: typeof ROWS }>();
    const user = userEvent.setup();
    render(
      <RecordWorkbench
        engine={engineWith(testSource({ paged: () => pending.promise }))}
        definitionId="orders"
        instanceId="mine"
      />,
    );
    const toggle = await screen.findByRole('button', { name: FILL });

    await user.click(toggle);
    expect(isExpanded()).toBe(true);
    expect(document.body.style.overflow).toBe('hidden');

    pending.resolve({ total: 2, list: [...ROWS] });
    await screen.findByRole('table');
    // The result arriving underneath changes nothing about the surface.
    expect(isExpanded()).toBe(true);
  });

  it('expands over a query that failed, strip and all', async () => {
    const user = userEvent.setup();
    render(
      <RecordWorkbench
        engine={engineWith(
          testSource({ paged: () => Promise.reject(new Error('offline')) }),
        )}
        definitionId="orders"
        instanceId="mine"
      />,
    );
    await screen.findByRole('alert');

    await user.click(screen.getByRole('button', { name: FILL }));
    expect(isExpanded()).toBe(true);
    expect(screen.getByRole('alert')).toBeDefined();
  });

  it('expands an analysis that has no result to show yet', async () => {
    const pending = deferred<Record<string, unknown>[]>();
    const user = userEvent.setup();
    render(
      <AnalysisWorkbench
        engine={engineWith(testSource({ aggregate: () => pending.promise }))}
        definitionId="orders"
        instanceId="by-warehouse"
      />,
    );
    const toggle = await screen.findByRole('button', { name: FILL });

    await user.click(toggle);
    // Nothing to show yet — no table, no chart — and the surface fills the
    // screen over what there is.
    expect(screen.queryByRole('table')).toBeNull();
    expect(isExpanded()).toBe(true);
    expect(document.body.style.overflow).toBe('hidden');
    pending.resolve([{ warehouse: 'CN', orders: 2, amount_sum: 30 }]);
  });

  it('expands with the view list folded away', async () => {
    const user = await open();
    await user.click(screen.getByRole('button', { name: COLLAPSE_SIDEBAR }));

    await user.click(screen.getByRole('button', { name: FILL }));

    expect(isExpanded()).toBe(true);
    // Both are this screen at this moment, and neither undoes the other.
    expect(document.querySelector('[data-slot="view-sidebar"]')).toBeNull();
    expect(screen.getByRole('button', { name: SWITCH })).toBeDefined();
  });

  it('offers nothing over a view that would not open', async () => {
    render(
      <RecordWorkbench
        engine={engineWith()}
        definitionId="orders"
        instanceId="no-such-view"
      />,
    );
    await screen.findByRole('alert');

    // The toggle lives in the title bar, and there is no title bar over a
    // view nobody could draw.
    expect(screen.queryByRole('button', { name: FILL })).toBeNull();
    expect(document.body.style.overflow).toBe('');
  });

  it('gives the page back the moment the control is taken away', async () => {
    document.body.style.setProperty('overflow', 'auto');
    const user = userEvent.setup();
    const engine = engineWith();
    const view = render(<Shell engine={engine} />);
    await screen.findByText('rows');
    await user.click(screen.getByRole('button', { name: FILL }));
    expect(document.body.style.overflow).toBe('hidden');

    view.rerender(<Shell engine={engine} expandable={false} />);

    // An expansion with no way out would be a trap, so it ends with the
    // control: withdrawing the button releases the surface rather than
    // leaving it pinned over a page whose scrolling is still locked.
    expect(isExpanded()).toBe(false);
    expect(screen.queryByRole('button', { name: LEAVE })).toBeNull();
    expect(document.body.style.overflow).toBe('auto');
  });
});

/**
 * The embed grows no control of its own — it is the result and nothing else,
 * and a button floating over somebody's order page is chrome that page did
 * not ask for and cannot place. What it owes a host that wants one is the
 * means: the surface, and the hook the workbench uses on it.
 */
describe('an embedded view, expanded by its host', () => {
  function HostedEmbed() {
    const root = useRef<HTMLDivElement>(null);
    const toggle = useRef<HTMLButtonElement>(null);
    const expansion = useViewExpansion(root, toggle);
    return (
      <>
        <button ref={toggle} type="button" onClick={expansion.toggle}>
          host control
        </button>
        <EmbeddedView ref={root} engine={engineWith()} instanceId="mine" />
      </>
    );
  }

  it('offers nothing of its own', async () => {
    render(<EmbeddedView engine={engineWith()} instanceId="mine" />);
    await screen.findByRole('table');

    expect(screen.queryByRole('button', { name: FILL })).toBeNull();
    expect(screen.queryByRole('button', { name: LEAVE })).toBeNull();
  });

  it('expands under a control the host owns, and locks the page once', async () => {
    document.body.style.setProperty('overflow', 'auto');
    const user = userEvent.setup();
    render(<HostedEmbed />);
    await screen.findByRole('table');

    await user.click(screen.getByRole('button', { name: 'host control' }));
    expect(isExpanded()).toBe(true);
    expect(document.body.style.overflow).toBe('hidden');

    await user.keyboard('{Escape}');
    expect(isExpanded()).toBe(false);
    expect(document.activeElement).toBe(
      screen.getByRole('button', { name: 'host control' }),
    );
    expect(document.body.style.overflow).toBe('auto');
  });

  it('hands back the root either way a ref is written', async () => {
    const held: (HTMLElement | null)[] = [];
    render(
      <EmbeddedView
        ref={node => {
          held.push(node);
        }}
        engine={engineWith()}
        instanceId="mine"
      />,
    );
    await screen.findByRole('table');

    // A callback ref as readily as an object one — and the element it gets is
    // the `.fve-root` itself, which is the only element the stylesheet will
    // expand. The surface keeps its own handle on the same node: it reads the
    // resolved light/dark mode off it, and a caller's ref arriving through
    // `...props` would have replaced that one and broken the cascade.
    expect(held[0]).toBe(surface());
    expect(surface().classList.contains('fve-root')).toBe(true);
  });
});

/**
 * The shell over a real workbench, for the props no default workbench hands
 * over. Bending one of them into the shape would be testing the bending.
 */
function Shell({
  engine,
  ...props
}: {
  engine: ViewEngine;
} & Partial<Parameters<typeof WorkbenchShell>[0]>) {
  const workbench = useWorkbench(engine, 'orders', {
    kind: 'record',
    instanceId: 'mine',
  });
  return (
    <WorkbenchShell
      workbench={workbench}
      kind="record"
      title="Orders"
      editorLabel={defaultMessages['label.filter.panel']}
      editor={<div data-slot="stub-editor">conditions</div>}
      result={<div data-slot="stub-result">rows</div>}
      {...props}
    />
  );
}
