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

import type { DeepReadonly } from '../lib/types.js';
import type { AnalysisPlan, AnalysisRow } from './analysisModel.js';
import type { AnalysisPresentation } from './analysisPresentation.js';
import { ANALYSIS_VISUALIZATIONS } from './analysisVisualizations.js';
import { projectAnalysis } from './analysisProjection.js';

export function initialDisplayMapping(
  value: DeepReadonly<AnalysisPresentation>,
  plan: DeepReadonly<AnalysisPlan>,
  layout: AnalysisPresentation['layout'],
): AnalysisPresentation {
  const chart = ANALYSIS_VISUALIZATIONS.find(item => item.value === layout)!;
  const dimensions = plan.schema.filter(column => column.role === 'dimension');
  const axes = chart.continuous
    ? dimensions.filter(
        column =>
          column.valueType === 'datetime' || column.valueType === 'number',
      )
    : dimensions;
  const metrics = plan.schema.filter(
    column =>
      column.role === 'metric' &&
      column.valueType === 'number' &&
      column.aggregation !== 'ANY',
  );
  const x = value.x ?? (axes.length === 1 ? axes[0].alias : '');
  const others = dimensions.filter(column => column.alias !== x);
  return {
    ...value,
    columns: value.columns.map(column => ({ ...column })),
    layout,
    ...(chart.axes
      ? {
          x,
          ...(dimensions.length > 1
            ? {
                series:
                  value.series ??
                  (x && others.length === 1 ? others[0].alias : ''),
              }
            : {}),
        }
      : {}),
    metrics: value.metrics
      ? [...value.metrics]
      : metrics.length === 1
        ? [metrics[0].alias]
        : [],
  };
}

export function suitableVisualizations(
  plan: DeepReadonly<AnalysisPlan>,
  rows: DeepReadonly<readonly AnalysisRow[]>,
) {
  const dimensions = plan.schema.filter(column => column.role === 'dimension');
  const metrics = plan.schema.filter(
    column =>
      column.role === 'metric' &&
      column.valueType === 'number' &&
      column.aggregation !== 'ANY',
  );
  return ANALYSIS_VISUALIZATIONS.filter(chart => {
    if (chart.value === 'table') return false;
    const x = chart.continuous
      ? dimensions.find(
          column =>
            column.valueType === 'number' || column.valueType === 'datetime',
        )
      : dimensions[0];
    const metric =
      chart.value === 'pie'
        ? metrics.find(
            column =>
              column.aggregation === 'COUNT' || column.aggregation === 'SUM',
          )
        : metrics[0];
    const sample: AnalysisPresentation = {
      layout: chart.value,
      columns: [],
      x: x?.alias,
      series:
        dimensions.length === 2
          ? dimensions.find(column => column !== x)?.alias
          : undefined,
      metrics: metric ? [metric.alias] : [],
    };
    return projectAnalysis(plan, rows, sample).issues.length === 0;
  });
}
