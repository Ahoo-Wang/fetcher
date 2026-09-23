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

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { isOwnedPanel } from '../../dashboard/index.js';
import type { DashboardTab, ViewAudience } from '../../model/index.js';
import {
  toIssue,
  type DashboardController,
  type DashboardPanelView,
} from '../../react/index.js';
import type { DashboardRuntime, ViewEngine } from '../../runtime/index.js';
import type { Issue } from '../../model/index.js';
import { useAnnouncer } from '../Announcer.js';
import { panelNames } from '../DashboardGrid.js';
import type { MessageFormatters } from '../MessagesProvider.js';
import type { MessageKey } from '../messages.js';
import { SaveAsDialog } from '../SaveAsDialog.js';
import { NewAnalysisDialog, type NewAnalysis } from './NewAnalysisDialog.js';
import { PresentationDialog } from './PresentationDialog.js';
import { tabTitle } from './DashboardTabs.js';

/**
 * What batch B3 adds to building a board (D22 C–E), as the commands the
 * board's own menus call: the edit bar's 「新建分析…」, and on a panel's menu
 * 「改这里的展示…」, 「恢复为视图的样子」, 「另存为视图…」 and 「移到标签页 ›」.
 * Each opens what it needs and goes through the board's own edits
 * (`DashboardEditing`), so nothing is written until the board is saved.
 *
 * Which of them a given panel offers is `panelOffers`; a menu shows an entry
 * exactly when the command is here and the panel offers it (D4).
 */
export interface DashboardBuilding {
  /** Opens the dialog that makes a new analysis on the board (screen C). */
  onAddOwnedAnalysis(): void;
  /** Opens the visualization panel for one panel's own look (screen D). */
  onEditPresentation(panelId: string): void;
  /** Puts back the look of the view a panel shows. */
  onResetPresentation(panelId: string): void;
  /** Asks for a title and an audience, and saves an owned analysis as a view. */
  onSaveOwnedAsView(panelId: string): void;
  /** Moves a panel to another tab, at the first free place there. */
  onMovePanelToTab(panelId: string, tabId: string): void;
}

/**
 * What each command is called on a menu, so the edit bar and the panel menu
 * say the words the dialogs they open are headed by (zh:「新建分析…」
 * 「改这里的展示…」「恢复为视图的样子」「另存为视图…」「移到标签页」).
 */
export const DASHBOARD_BUILDING_LABELS = {
  onAddOwnedAnalysis: 'label.panel.new-analysis',
  onEditPresentation: 'label.panel.presentation',
  onResetPresentation: 'label.panel.presentation.reset',
  onSaveOwnedAsView: 'label.panel.save-owned',
  onMovePanelToTab: 'label.panel.move-to-tab',
} as const satisfies Record<keyof DashboardBuilding, MessageKey>;

/** Which of the commands one panel offers. */
export interface PanelOffers {
  /** An analysis panel that has something to draw can change its look. */
  presentation: boolean;
  /** A panel wearing a look of its own can put its view's back. */
  reset: boolean;
  /** An analysis the board owns can be saved as a view. */
  saveAsView: boolean;
  /** The tabs it can move to: every tab but its own, on a board with tabs. */
  tabs: readonly DashboardTab[];
}

export function panelOffers(
  panel: DashboardPanelView,
  dashboard: Pick<DashboardController, 'tabs'>,
): PanelOffers {
  const view = panel.panel.kind === 'view' ? panel.panel : null;
  const look: unknown = view?.presentation;
  return {
    presentation: panel.runtime?.kind === 'analysis',
    reset:
      typeof look === 'object' && look !== null && Object.keys(look).length > 0,
    saveAsView: view !== null && isOwnedPanel(view),
    tabs:
      dashboard.tabs.length < 2
        ? []
        : dashboard.tabs.filter(tab => tab.id !== panel.tab),
  };
}

export interface DashboardBuildingOptions {
  engine: ViewEngine;
  /** The board, while one is open. */
  board: DashboardRuntime | null;
  dashboard: DashboardController;
  /**
   * The wording in force where the board is drawn — the workbench's own,
   * merged over the host's — for what the commands say.
   */
  messages: MessageFormatters;
  optionsFor?: Parameters<typeof NewAnalysisDialog>[0]['optionsFor'];
}

/** What is open: nothing, or one of the three dialogs and whom it is about. */
type Open =
  | { kind: 'new' }
  | { kind: 'look'; panelId: string }
  | { kind: 'promote'; panelId: string }
  | null;

/**
 * The commands of `DashboardBuilding` over one board, and what they open:
 * the dialogs to draw beside the board, and the live region that says what
 * a command did. `building` is `null` while the board is not being built —
 * the commands are the builder's, never the reader's.
 */
export function useDashboardBuilding({
  engine,
  board,
  dashboard,
  messages,
  optionsFor,
}: DashboardBuildingOptions): {
  building: DashboardBuilding | null;
  dialogs: ReactNode;
} {
  const { say, region } = useAnnouncer('building-announcement');
  const [open, setOpen] = useState<Open>(null);
  const [saving, setSaving] = useState<{
    pending: boolean;
    error: Issue | null;
  }>({ pending: false, error: null });
  const names = panelNames(dashboard.panels, messages);
  const panelOf = (panelId: string | undefined) =>
    dashboard.panels.find(panel => panel.id === panelId) ?? null;

  // What a command reads when it runs: the board as it is then, not as it
  // was when the commands were made — they are made once per board and
  // editing session, so a host holding them is not told again every render.
  const latest = useRef({ dashboard, messages, say });
  useEffect(() => {
    latest.current = { dashboard, messages, say };
  });
  const editing = dashboard.editing;
  const building = useMemo<DashboardBuilding | null>(
    () =>
      board && editing
        ? {
            onAddOwnedAnalysis: () => setOpen({ kind: 'new' }),
            onEditPresentation: panelId => setOpen({ kind: 'look', panelId }),
            onResetPresentation: panelId =>
              board.setPresentation(panelId, null),
            onSaveOwnedAsView: panelId => {
              setSaving({ pending: false, error: null });
              setOpen({ kind: 'promote', panelId });
            },
            onMovePanelToTab: (panelId, tabId) => {
              const now = latest.current;
              const { tabs, panels } = now.dashboard;
              const at = tabs.findIndex(tab => tab.id === tabId);
              if (at < 0) return;
              board.movePanelToTab(panelId, tabId);
              now.say(
                now.messages.label('label.panel.moved-to-tab', {
                  title: panelNames(panels, now.messages).get(panelId) ?? '',
                  tab: tabTitle(tabs[at], at, now.messages),
                }),
              );
            },
          }
        : null,
    [board, editing],
  );

  const add = (analysis: NewAnalysis): boolean => {
    if (!board) return false;
    const id = board.addPanel(
      {
        kind: 'view',
        title: analysis.title,
        owned: { definitionId: analysis.definitionId, config: analysis.config },
      },
      dashboard.tab === null ? {} : { tab: dashboard.tab },
    );
    if (id === null) return false;
    say(
      messages.label('label.panel.new-analysis.added', {
        title: analysis.title,
      }),
    );
    return true;
  };

  const close = (next: boolean) => {
    if (!next) setOpen(null);
  };
  const looked = open?.kind === 'look' ? panelOf(open.panelId) : null;
  const promoted = open?.kind === 'promote' ? panelOf(open.panelId) : null;
  const owned =
    promoted?.panel.kind === 'view' && isOwnedPanel(promoted.panel)
      ? promoted.panel.owned
      : null;
  const ownedDefinition = owned
    ? engine.definitions.get(owned.definitionId)
    : undefined;
  const can = owned
    ? engine.permissions(owned.definitionId)
    : { createPersonal: false, createShared: false };
  const boardScope: ViewAudience =
    board?.getSnapshot().scope === 'personal' ? 'personal' : 'shared';

  const dialogs = board && (
    <>
      <NewAnalysisDialog
        engine={engine}
        open={open?.kind === 'new'}
        onOpenChange={close}
        onAdd={add}
        optionsFor={optionsFor}
      />
      <PresentationDialog
        panel={looked}
        name={looked ? (names.get(looked.id) ?? '') : ''}
        editing={board}
        onOpenChange={close}
      />
      <SaveAsDialog
        open={owned !== null}
        onOpenChange={close}
        intent="promote"
        title={promoted ? (names.get(promoted.id) ?? '') : ''}
        description={messages.label('label.panel.save-owned.description', {
          definition: ownedDefinition?.title ?? '',
        })}
        // The board's audience first: a shared board that stood on a
        // personal view would be a panel some of its readers cannot open.
        defaultScope={boardScope}
        commands={{
          can,
          state: saving,
          saveAs: async ({ title, scope }) => {
            if (!promoted) return null;
            setSaving({ pending: true, error: null });
            try {
              const instance = await engine.saveOwnedView(board, promoted.id, {
                title,
                scope,
              });
              setSaving({ pending: false, error: null });
              say(messages.label('label.panel.save-owned.saved', { title }));
              return instance;
            } catch (error) {
              setSaving({
                pending: false,
                error: toIssue(error, 'view.save.failed'),
              });
              return null;
            }
          },
        }}
      />
      {region}
    </>
  );
  return { building, dialogs };
}
