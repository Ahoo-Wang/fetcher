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

import { useMemo } from 'react';
import {
  drillConditions,
  fitChartSlots,
  fitCharts,
  focusOn,
  groupFor,
  groupableFields,
  momentColumns,
  projectAnalysis,
  shapeChart,
  splitBy,
  withStagesFrom,
  type AnalysisColumnView,
  type AnalysisView,
  type ChartData,
  type ChartFit,
  type Picked,
} from '../analysis/index.js';
import { describeFilter, type FilterSummaryItem } from '../filter/index.js';
import type {
  AnalysisViewConfig,
  ChartSpec,
  ChartType,
  FilterNode,
  RecordData,
} from '../model/index.js';
import { hasAsked, type ViewRuntime } from '../runtime/index.js';
import type { AnalysisEditorController } from './useAnalysisEditor.js';
import type { WorkbenchController } from './useWorkbench.js';

/** Stable identity for "nothing asked yet", so the memos below stay quiet. */
const NO_COLUMNS: readonly AnalysisColumnView[] = [];

/** A dimension a group can be split by: a field the result is not grouped on. */
export interface SplitOption {
  field: string;
  label: string;
}

/**
 * One thing the follow-up menu offers on a group (D20 追问). The menu draws
 * each kind its own way — an icon and a word are a host's to choose — and
 * runs it; which kinds are offered, in what order, and what running one
 * does are decided here, so a new follow-up is a new member of this union
 * and one more entry in `followUp`, not another pair of props on the menu.
 */
export type FollowUpAction =
  /** Open the records behind the group, in a record view of their own. */
  | { kind: 'records'; run(): void }
  /** Ask the same question of the group, by one more dimension. */
  | { kind: 'split'; options: readonly SplitOption[]; run(field: string): void }
  /** Narrow the range to the group, and run. */
  | { kind: 'focus'; run(): void };

/** What the menu over one pressed group shows. */
export interface FollowUp {
  /** The group, named by its conditions as the applied bar names them. */
  conditions: readonly FilterSummaryItem[];
  actions: readonly FollowUpAction[];
}

export interface AnalysisResultController {
  /** The rows on screen, or null while there are none of an analysis. */
  view: AnalysisView | null;
  /** The config those rows ran on: what a chart and a follow-up address. */
  ran: AnalysisViewConfig | undefined;
  /**
   * The question the result answers or will answer: `ran` once rows are on
   * screen; before any are, the config on its way or the one that failed.
   * Undefined while nothing has been asked (`hasAsked`). What the rows are
   * *shaped* by — the reading, the chart types that fit, the slots a chart
   * can name — is known from the moment the question is sent, so the
   * toolbar and the visualization panel work while the first answer is on
   * its way and after it failed; only what needs the rows waits for them.
   */
  question: AnalysisViewConfig | undefined;
  /**
   * Every column of that question, as the result names them — the rows' own
   * schema, or the same projection over no rows while none have landed —
   * and the ones the table draws, in its order (`AnalysisView.columns`).
   * Both empty while nothing has been asked. The toolbar reads the first
   * out; a skeleton standing in for the table draws a bar per the second.
   */
  columns: readonly AnalysisColumnView[];
  tableColumns: readonly AnalysisColumnView[];
  /** The chart drawn over those rows, as the draft says to draw it. */
  chart: ChartSpec;
  /** The rows shaped for `chart`, or undefined while there is nothing to draw. */
  chartData: ChartData | undefined;
  /** Which chart types the question's shape can draw (`fitCharts`). */
  fits: Record<ChartType, ChartFit>;
  /** What the visualization panel shows as chosen. */
  picked: Picked;
  /** Draw the rows as this type, or as the table. Redraws; never runs. */
  choose(next: Picked): void;
  /**
   * Whether a group of this result can be followed up at all: an analysis
   * over expanded elements has rows no root condition selects.
   */
  pickable: boolean;
  /** The menu over one pressed group, or null when no condition can say it. */
  followUp(row: RecordData): FollowUp | null;
}

/**
 * The analysis result as a host draws it (phase-2 review, developer #9):
 * which rows, which chart over them, what the picker offers, and what a
 * press on one group can do next. Everything here reads a kernel and writes
 * the runtime; the component that draws it keeps only what is about the
 * screen — which panel is open, where the keyboard is, which mark was
 * pressed and where. `/ui` consumes this and nothing below it, which is
 * the contract its entry states.
 *
 * **The rows are the config that ran; how they are looked at is the
 * draft.** A result's rows and columns come from the config it was shaped
 * by, and nothing else can name them. The layout and the chart are
 * presentation (D20, `ANALYSIS_PRESENTATION_MEMBERS`): drawn from those
 * rows as the draft says, so switching to a chart or picking another type
 * redraws without a run. The draft's chart is fitted to the shape that ran
 * **only while the two shapes differ** — a dimension added in the tray but
 * not yet run is no column of these rows — because `fitChartSlots` opens a
 * narrowed slot back up, which is right when the shape moved under the
 * chart and wrong on every render of a chart narrowed on purpose.
 *
 * A follow-up is read off the same config the rows ran on, not the draft:
 * the group pressed is a group of that result, not of what is being edited.
 */
export function useAnalysisResult(
  runtime: ViewRuntime<AnalysisViewConfig> | null,
  analysis: AnalysisEditorController,
  workbench: Pick<WorkbenchController, 'state' | 'canDrill' | 'drill'>,
): AnalysisResultController {
  const result = workbench.state?.result;
  const data = result?.data;
  const view: AnalysisView | null =
    data?.kind === 'analysis' ? data.view : null;
  const ran = result?.config.kind === 'analysis' ? result.config : undefined;
  // Before the first answer, the question itself. A query that was sent was
  // admitted, so the applied config is one the kernel can project; a config
  // refused before it ran was never asked, and stays undefined.
  const state = workbench.state;
  const applied = state?.applied;
  const asked =
    !ran && hasAsked(state) && applied?.kind === 'analysis'
      ? applied
      : undefined;
  const question = ran ?? asked;
  const definition = runtime?.definition;
  const shape = useMemo<Pick<AnalysisView, 'columns' | 'schema'> | null>(
    () =>
      view ??
      (asked && definition
        ? // Over no rows and as a table: the columns are all that is
          // wanted, and a chart shaped from nothing is work for no one.
          projectAnalysis(definition, { ...asked, layout: 'table' }, [])
        : null),
    [view, asked, definition],
  );
  const columns = shape ? (shape.schema ?? shape.columns) : NO_COLUMNS;
  const tableColumns = shape?.columns ?? NO_COLUMNS;

  const drafted = shapeKey(analysis.aliases.groups, analysis.aliases.metrics);
  const shapeAsked = question
    ? shapeKey(
        question.groups.map(group => group.alias),
        question.metrics.map(metric => metric.alias),
      )
    : null;
  // The moments of the question, read off its projection: a column that
  // reads as a date is one (`momentMetrics`), and no mark measures it.
  const moments = useMemo(() => momentColumns(columns), [columns]);
  const chart = useMemo(
    () =>
      question && shapeAsked !== drafted
        ? fitChartSlots(
            analysis.chart,
            question.groups,
            question.metrics,
            moments,
          )
        : analysis.chart,
    [analysis.chart, question, shapeAsked, drafted, moments],
  );
  const fits = useMemo(
    () =>
      fitCharts({
        groups: question?.groups ?? [],
        metrics: question?.metrics ?? [],
        moments,
      }),
    [question, moments],
  );
  // A chart the question's shape cannot draw — every metric a moment,
  // nothing to measure — is its table: the rows are there, and an empty
  // frame would say there were none. Before anything was asked there is no
  // shape to judge.
  const drawable = !question || fits[chart.type]?.available !== false;
  const chartData = useMemo(
    () =>
      view && ran && drawable
        ? shapeChart({ ...ran, chart, layout: 'chart' }, view.rows, view.totals)
        : undefined,
    [view, ran, chart, drawable],
  );
  const picked: Picked =
    analysis.layout === 'table' || !drawable ? 'table' : chart.type;

  const choose = (next: Picked) => {
    if (next === 'table') {
      analysis.setLayout('table');
      return;
    }
    analysis.setLayout('chart');
    if (!question) return;
    // Fitted to the question's shape, so a type picked while the first
    // answer is on its way — or after it failed — is the chart the rows
    // land in; and a funnel of a group's values given the order they came
    // in, once there are rows to take it from.
    const fitted = fitChartSlots(
      { ...chart, type: next },
      question.groups,
      question.metrics,
      moments,
    );
    analysis.updateChart(view ? withStagesFrom(fitted, view.rows) : fitted);
  };

  const pickable =
    ran !== undefined &&
    !(ran.elements && ran.elements.length > 0) &&
    runtime !== null;

  const followUp = (row: RecordData): FollowUp | null => {
    if (!pickable || !ran || !runtime) return null;
    const conditions = drillConditions(
      ran,
      runtime.fields,
      runtime.kinds,
      row,
      { timeZone: runtime.environment.timeZone },
    );
    if (!conditions) return null;
    const actions: FollowUpAction[] = [];
    if (workbench.canDrill)
      actions.push({ kind: 'records', run: () => workbench.drill(conditions) });
    // Groupable fields the result is not already grouped by — the list the
    // tray adds a dimension from (`groupableFields`) — read off the config
    // that ran, for the reason the conditions are.
    const options: SplitOption[] = groupableFields(
      analysis.fields,
      ran.groups,
    ).map(option => ({ field: option.field, label: option.label }));
    if (options.length > 0)
      actions.push({
        kind: 'split',
        options,
        run: name => split(runtime, analysis, ran, conditions, name, moments),
      });
    actions.push({
      kind: 'focus',
      run: () => {
        runtime.edit(focusOn(ran, conditions));
        runtime.apply();
      },
    });
    return {
      conditions: describeFilter(
        runtime.fields,
        { op: 'and', children: conditions },
        runtime.kinds,
      ),
      actions,
    };
  };

  return {
    view,
    ran,
    question,
    columns,
    tableColumns,
    chart,
    chartData,
    fits,
    picked,
    choose,
    pickable,
    followUp,
  };
}

function split(
  runtime: ViewRuntime<AnalysisViewConfig>,
  analysis: AnalysisEditorController,
  ran: AnalysisViewConfig,
  conditions: readonly FilterNode[],
  name: string,
  moments: ReadonlySet<string>,
): void {
  const field = runtime.fields.find(entry => entry.name === name);
  const option = analysis.fields.find(entry => entry.field === name);
  if (!field || !option) return;
  runtime.edit(
    splitBy(
      ran,
      conditions,
      groupFor(field, option, runtime.kinds.get(field.kind)),
      moments,
    ),
  );
  runtime.apply();
}

/**
 * One shape as the one string a chart addresses it by: a chart names groups
 * and metrics by alias and by nothing else, so two shapes that spell the
 * same aliases in the same order are one shape as far as its slots go. The
 * separators are control characters no alias can hold, written as escapes:
 * a raw one in the source makes every text tool read the file as binary.
 */
function shapeKey(groups: readonly string[], metrics: readonly string[]) {
  return `${groups.join('\u0000')}\u0001${metrics.join('\u0000')}`;
}
