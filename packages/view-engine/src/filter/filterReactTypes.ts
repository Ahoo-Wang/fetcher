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

import type { ComponentType, ReactNode } from 'react';
import type { FilterExpression, FilterOperator } from '@ahoo-wang/fetcher-wow';
import type { FilterOption } from './filterTypes.js';
import type { DeepReadonly } from '../lib/types.js';
import type {
  FilterDraftNode,
  FilterEditorReference,
  FilterFieldDefinition,
  FilterJsonValue,
  FilterMode,
} from './filterModel.js';

/** UI-library-independent value editor. Inputs are read-only snapshots, not applied query state. */
export interface FilterEditorProps {
  node: DeepReadonly<FilterExpression> | undefined;
  operator: FilterOperator;
  field?: DeepReadonly<FilterFieldDefinition>;
  fields: DeepReadonly<readonly FilterFieldDefinition[]>;
  mode: FilterMode;
  context?: unknown;
  options?: DeepReadonly<Record<string, FilterJsonValue>>;
  disabled: boolean;
  /** Publish a valid node for the same binding. Undefined clears a valued node, or removes a value-free node. Never queries. */
  onChange(node: FilterExpression | undefined): void;
  /** Invalid local buffers must report false; an empty message still blocks application. */
  onValidityChange(valid: boolean, message?: string): void;
}
/** Complete non-container UI. The panel still owns layout, errors, binding, compilation and Query. */
export interface FilterComponentProps extends FilterEditorProps {
  /** Stable DOM-safe identity for this mounted panel/node; never persist it. */
  readonly id: string;
  /** Labels and capability restrictions for the current binding and mode. */
  readonly operators: DeepReadonly<readonly FilterOption<FilterOperator>[]>;
  readonly errors: readonly string[];
  /** Connect inputs with aria-describedby when the panel displays an error. */
  readonly errorId?: string;
  /** Use the panel's operator transition rules, preserving compatible values and pending invalid input. */
  onOperatorChange(operator: FilterOperator): void;
  /** Same unset semantics as onChange(undefined); remounts the editor to discard its local buffer. */
  onClear(): void;
  /** Removes the whole node. Does not apply or save. */
  onRemove(): void;
}
export interface FilterEditorRegistration {
  /** Default: compose this component inside the built-in field/operator/remove frame. */
  render?: 'value';
  component: ComponentType<FilterEditorProps>;
  modes: readonly FilterMode[];
  supports?: (node: DeepReadonly<FilterExpression> | undefined) => boolean;
}
export interface FilterComponentRegistration extends Omit<
  FilterEditorRegistration,
  'component' | 'render'
> {
  /** Render the complete non-container UI, without the built-in frame. */
  render: 'filter';
  component: ComponentType<FilterComponentProps>;
}
export type FilterRegistration =
  FilterEditorRegistration | FilterComponentRegistration;
export interface FilterExtensions {
  filters?: Readonly<Record<string, FilterRegistration>>;
}
/** Compose panel controls elsewhere without bypassing the panel's mode transition guards. */
export interface FilterPanelToolbarProps {
  panelId: string;
  mode: FilterMode;
  options: readonly FilterOption<FilterMode>[];
  pending: boolean;
  disabled: boolean;
  onModeChange(mode: FilterMode): void;
}
export interface FilterPanelProps {
  value: DeepReadonly<FilterExpression>;
  fields: readonly FilterFieldDefinition[];
  onApply(expression: FilterExpression): void;
  mode?: FilterMode;
  onModeChange?(mode: FilterMode): void;
  onPendingChange?(pending: boolean): void;
  /** Optional controlled transient tree; keep it per view instance to preserve unmounted editors. */
  draft?: DeepReadonly<FilterDraftNode>;
  onDraftChange?(draft: FilterDraftNode): void;
  /** Controlled last-applied editor tree, including unset controls. */
  appliedDraft?: DeepReadonly<FilterDraftNode>;
  /** Reports local buffer and editor validity; pending remains derived. */
  onValidityChange?(valid: boolean): void;
  allowedOperators?: readonly FilterOperator[];
  extensions?: FilterExtensions;
  editors?: Readonly<Partial<Record<FilterOperator, FilterEditorReference>>>;
  context?: unknown;
  querying?: boolean;
  queryError?: ReactNode;
  disabled?: boolean;
  /** Hide the body while retaining mounted editors and their local buffers. */
  collapsed?: boolean;
  /** Replaces the default header; rendered before the collapsible panel body. */
  renderToolbar?(props: FilterPanelToolbarProps): ReactNode;
  className?: string;
}
