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
  ANALYSIS_VISUALIZATIONS,
  getAnalysisVisualization,
} from './analysisVisualizations.js';
import { Checkbox } from '../components/ui/checkbox.js';
import { FilterSelect } from '../filter/FilterSelect.js';
import type { DeepReadonly } from '../lib/types.js';
import type { AnalysisPlan } from './analysisModel.js';
import {
  pruneAnalysisPresentation,
  resolveAnalysisAxes,
} from './analysisPresentation.js';
import type { AnalysisPresentation } from './analysisPresentation.js';
import { projectAnalysis } from './analysisProjection.js';

export interface AnalysisPresentationEditorProps {
  value: DeepReadonly<AnalysisPresentation>;
  plan?: DeepReadonly<AnalysisPlan>;
  onChange(next: AnalysisPresentation): void;
  disabled?: boolean;
  /** Show notices for standalone editors; a surrounding result view can own them instead. */
  showIssues?: boolean;
}
/** Display-only controls over the executed schema. The host owns querying and stale guards. */
export function AnalysisPresentationEditor({
  value,
  plan,
  onChange,
  disabled,
  showIssues = true,
}: AnalysisPresentationEditorProps) {
  const visualization = getAnalysisVisualization(value.layout);
  const locked = disabled || !plan;
  const dimensions = plan?.schema.filter(c => c.role === 'dimension') ?? [];
  const metrics =
    plan?.schema.filter(
      c =>
        c.role === 'metric' &&
        c.valueType === 'number' &&
        c.aggregation !== 'ANY',
    ) ?? [];
  const selected = Array.isArray(value.metrics)
    ? value.metrics.filter(alias =>
        metrics.some(metric => metric.alias === alias),
      )
    : metrics.map(c => c.alias);
  const retained = pruneAnalysisPresentation(
    value,
    dimensions,
    plan?.schema.filter(column => column.role === 'metric') ?? [],
  );
  const axes = resolveAnalysisAxes(dimensions, value);
  const x = axes.x?.alias;
  const issues =
    showIssues && plan ? projectAnalysis(plan, [], value).issues : [];
  const options = dimensions.map(c => ({ value: c.alias, label: c.title }));
  const update = (patch: Partial<AnalysisPresentation>) => {
    if (!locked)
      onChange({
        ...retained,
        ...patch,
      });
  };
  const changeLayout = (layout: AnalysisPresentation['layout']) => {
    if (!locked) onChange({ ...retained, layout });
  };
  return (
    <div
      className="fve:flex fve:min-w-0 fve:flex-col fve:gap-3"
      aria-label="图表设置"
    >
      <div className="fve:flex fve:flex-wrap fve:items-end fve:gap-3">
        <label className="fve:flex fve:min-w-0 fve:flex-col fve:gap-1">
          <span className="fve:text-xs fve:text-muted-foreground">图表</span>
          <FilterSelect
            label="图表类型"
            options={ANALYSIS_VISUALIZATIONS}
            value={value.layout}
            disabled={locked}
            onValueChange={changeLayout}
          />
        </label>
        {visualization?.axes && (
          <>
            <label className="fve:flex fve:min-w-0 fve:flex-col fve:gap-1">
              <span className="fve:text-xs fve:text-muted-foreground">
                分类轴
              </span>
              <FilterSelect
                label="横轴维度"
                options={options}
                value={x}
                disabled={locked}
                onValueChange={next =>
                  update({
                    x: next,
                    series: next === value.series ? undefined : value.series,
                  })
                }
              />
            </label>
            {visualization?.series && dimensions.length > 1 && (
              <label className="fve:flex fve:min-w-0 fve:flex-col fve:gap-1">
                <span className="fve:text-xs fve:text-muted-foreground">
                  拆分系列
                </span>
                <FilterSelect
                  label="系列维度"
                  placeholder="不拆分系列"
                  options={options.filter(c => c.value !== x)}
                  value={axes.series?.alias}
                  disabled={locked}
                  onClear={
                    dimensions.length === 2
                      ? undefined
                      : () => update({ series: undefined })
                  }
                  onValueChange={series => update({ series })}
                />
              </label>
            )}
          </>
        )}
        {visualization?.orientation && (
          <label className="fve:flex fve:min-w-0 fve:flex-col fve:gap-1">
            <span className="fve:text-xs fve:text-muted-foreground">方向</span>
            <FilterSelect
              label="柱状图方向"
              options={[
                { value: 'vertical', label: '纵向' },
                { value: 'horizontal', label: '横向' },
              ]}
              value={value.orientation ?? 'vertical'}
              disabled={locked}
              onValueChange={orientation => update({ orientation })}
            />
          </label>
        )}
        {visualization?.stacked && (
          <label className="fve:flex fve:items-center fve:gap-2 fve:text-sm">
            <Checkbox
              checked={value.stacked ?? false}
              disabled={locked}
              onCheckedChange={stacked => update({ stacked })}
            />
            堆叠
          </label>
        )}
        {visualization?.donut && (
          <label className="fve:flex fve:items-center fve:gap-2 fve:text-sm">
            <Checkbox
              checked={value.donut ?? false}
              disabled={locked}
              onCheckedChange={donut => update({ donut })}
            />
            环形
          </label>
        )}
        {value.layout !== 'table' && (
          <fieldset
            className="fve:m-0 fve:flex fve:min-w-0 fve:flex-wrap fve:gap-3 fve:border-0 fve:p-0"
            disabled={locked}
          >
            <legend className="fve:mb-1 fve:text-xs fve:text-muted-foreground">
              显示指标
            </legend>
            {metrics.map(metric => (
              <label
                key={metric.alias}
                className="fve:flex fve:items-center fve:gap-2 fve:text-sm"
              >
                <Checkbox
                  checked={selected.includes(metric.alias)}
                  disabled={locked}
                  onCheckedChange={checked =>
                    update({
                      metrics: checked
                        ? visualization?.donut
                          ? [metric.alias]
                          : [...selected, metric.alias]
                        : selected.filter(alias => alias !== metric.alias),
                    })
                  }
                />
                {metric.title}
              </label>
            ))}
          </fieldset>
        )}
      </div>
      {issues.length > 0 && (
        <p role="status" className="fve:text-sm fve:text-muted-foreground">
          {issues.join('；')}。数据表仍可查看。
        </p>
      )}
    </div>
  );
}
