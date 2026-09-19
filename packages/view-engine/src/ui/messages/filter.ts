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

/** The condition builder, the applied-condition bar, and the filter kernel. */
export const filterMessages = {
  // Mode switches.
  'label.filter.simple': 'Simple',
  'label.filter.advanced': 'Advanced',
  'label.filter.all-of': 'All of',
  'label.filter.any-of': 'Any of',
  'label.filter.none-of': 'None of',
  'label.filter.choose': 'Choose',

  // The condition builder. The names ending in `-of` are accessible names,
  // which is why they read as a field followed by what the control does: a
  // screen reader announces them one after another and nothing else tells
  // the two `warehouse` selects apart.
  'label.filter.panel': 'Filter',
  'label.filter.mode': 'Filter mode',
  'label.filter.clear': 'Clear',
  'label.filter.apply': 'Apply',
  // An edited condition changes nothing until it is applied, and a condition
  // with an error stops the whole submission; both are marked where they are.
  'label.filter.pending': 'Not applied yet',
  'label.filter.blocked': '{count} to fix',
  'label.filter.group-operator': 'Group operator',
  'label.filter.remove-group': 'Remove group',
  'label.filter.add': 'Add',
  'label.filter.add-here': 'Add in this group',
  'label.filter.nested-group': 'Group',
  'label.filter.condition-of': '{field} condition',
  'label.field.none': 'No field matches',
  'label.field.search': 'Search fields',
  'label.filter.operator-of': '{field} operator',
  'label.filter.value-of': '{field} value',
  'label.filter.remove-of': 'Remove {field}',
  'label.filter.unset-of': 'Unset {condition}',
  'label.filter.comma-separated': 'Comma separated',
  'label.filter.range-from': '{field} from',
  'label.filter.range-to': '{field} to',
  'label.boolean.true': 'True',
  'label.boolean.false': 'False',
  'label.filter.too-large': 'This filter is too large to edit here.',

  // The conditions the result in front of you actually ran with, which is
  // not the draft above it.
  'label.applied.title': 'Showing',
  'label.applied.all': 'All records',
  // A condition the host put in force, which the reader cannot take out:
  // it is not in the draft, and no path of this editor addresses it.
  'label.applied.scoped': 'Set by the page',

  // The three date shapes, the side of now a relative window lies on, and
  // the controls that edit them.
  'label.date.absolute': 'On a date',
  'label.date.relative': 'Relative',
  'label.date.preset': 'A period',
  'label.date.past': 'In the last',
  'label.date.future': 'In the next',
  'label.date.pick': 'Pick a date',
  'label.date.shape-of': '{field} kind',
  'label.date.direction-of': '{field} direction',
  'label.date.amount-of': '{field} amount',
  'label.date.unit-of': '{field} unit',
  'label.date.period-of': '{field} period',

  // Operator names a component would otherwise derive from the enum. Only the
  // ones whose derived spelling is unreadable need an entry; the rest fall
  // back, so this list stays short and an application can still name any of
  // them by adding a key.
  'label.operator.ID': 'is',
  'label.operator.IDS': 'is any of',
  'label.operator.AGGREGATE_ID': 'is',
  'label.operator.AGGREGATE_IDS': 'is any of',
  'label.operator.TENANT_ID': 'is',
  'label.operator.OWNER_ID': 'is',
  'label.operator.SPACE_ID': 'is',
  'label.operator.IS_EMPTY_STRING': 'is blank',
  'label.operator.IS_NOT_EMPTY_STRING': 'is not blank',
  'label.operator.IS_NULL': 'is empty',
  'label.operator.IS_NOT_NULL': 'is not empty',
  'label.operator.NOT_EXISTS': 'does not exist',
  'label.operator.IN': 'is any of',
  'label.operator.NOT_IN': 'is none of',
  'label.operator.CONTAINS_ALL': 'has all of',
  'label.operator.IS_EMPTY': 'has no entries',
  'label.operator.STARTS_WITH': 'starts with',
  'label.operator.ENDS_WITH': 'ends with',
  'label.operator.SEARCH': 'contains',
  'label.operator.ELEMENT_MATCH': 'has an entry where',

  // Filter kernel.
  'filter.field.reference-without-source':
    '{field} is a reference field with no candidate source declared.',
  'filter.field.duplicate-in-group':
    '{field} is already a condition in this group. Nest a group to ask it something else.',
  'filter.field.unknown': 'The field {field} no longer exists.',
  'filter.group.unknown-operator': 'A condition group must be AND or OR.',
  'filter.kind.unregistered': 'No editor is registered for the {kind} type.',
  'filter.node.invalid': 'This condition could not be read.',
  'filter.operator.unsupported': '{field} does not support {operator}.',
  'filter.tree.too-deep': 'The conditions nest deeper than {max} levels.',
  'filter.tree.too-many-nodes': 'The conditions exceed {max} entries.',
  'filter.value.expected-boolean': 'Choose yes or no.',
  'filter.value.expected-date': 'Enter a date.',
  'filter.value.expected-id': 'Enter an id, or pick a candidate.',
  'filter.value.expected-id-list': 'Enter one or more ids.',
  'filter.value.expects-one': 'This condition takes a single value.',
  'filter.value.expected-text': 'Type what to search for.',
  'filter.element.root-filter':
    '{field} asks about the whole record, so it cannot be asked of one entry.',
  'filter.value.expected-predicate': 'Describe what an entry must match.',
  'filter.field.holds-no-elements':
    '{field} holds no entries to match against.',
  'filter.value.expected-entry-list': 'Choose or enter one or more entries.',
  'filter.value.expected-number': 'Enter a number.',
  'filter.value.expected-number-list': 'Enter one or more numbers.',
  'filter.value.expected-number-range': 'Enter a range of two numbers.',
  'filter.value.expected-option-list': 'Choose one or more options.',
  'filter.value.expected-reference-list': 'Choose one or more records.',
  'filter.value.expected-string': 'Enter a value.',
  'filter.value.expected-string-list': 'Enter one or more values.',
  'filter.value.inverted-range': 'The range starts after it ends.',
  'filter.value.relative-too-large':
    'A relative window can reach at most {max} units.',
  'filter.value.required': 'This condition needs a value.',
  'filter.value.unknown-option': '{values} is no longer an option.',
  'filter.value.unknown-time-zone':
    '{timeZone} is not a time zone this browser knows.',
  'filter.value.unparsable-date': 'That date cannot be read.',
} as const satisfies Record<string, string>;
