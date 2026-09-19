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

import type { FilterMode } from '../../model/index.js';
import type { FilterEditorController } from '../../react/index.js';
import {
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '../components/dropdown-menu.js';
import { useViewMessages } from '../MessagesProvider.js';

/**
 * Whether the condition editor shows one strip of conditions or the whole
 * tree, as the two items of the editor's own menu.
 *
 * The mode is a way of *editing* rather than part of the filter, which is
 * why it left the panel: the panel is the conditions, and everything about
 * how they are edited now hangs off the one toggle in the title bar.
 *
 * What it shows is the mode in force, not the mode stored. A config saved as
 * simple may hold a group, which the simple editor cannot draw faithfully,
 * and the editor opens advanced regardless; the menu says so — and says why
 * simple is not on offer — rather than claiming a mode the editor below is
 * not in.
 */
export function FilterModes({ filter }: { filter: FilterEditorController }) {
  const messages = useViewMessages();
  const locked = !filter.simple;
  const effective =
    filter.mode === 'advanced' || locked ? 'advanced' : 'simple';

  return (
    <DropdownMenuRadioGroup
      value={effective}
      // Base UI types a radio group's value as `any`. Naming the
      // parameter's type keeps that `any` out of this file; a runtime guard
      // would be a branch nothing can reach, because the only two values in
      // the group are the two items below.
      onValueChange={(next: FilterMode) => filter.setMode(next)}
    >
      <DropdownMenuLabel>
        {messages.label('label.filter.mode')}
      </DropdownMenuLabel>
      <DropdownMenuRadioItem
        value="simple"
        closeOnClick
        disabled={locked}
        // The reason travels with the item rather than sitting under the
        // menu as a line of prose: a screen reader announces a disabled
        // option and then has nowhere to go looking for why.
        aria-description={
          locked ? messages.label('config.filterMode.not-simple') : undefined
        }
      >
        {messages.label('label.filter.simple')}
      </DropdownMenuRadioItem>
      <DropdownMenuRadioItem value="advanced" closeOnClick>
        {messages.label('label.filter.advanced')}
      </DropdownMenuRadioItem>
    </DropdownMenuRadioGroup>
  );
}

/** The mode in force, for the editor toggle's name. */
export function filterModeLabel(
  filter: FilterEditorController,
  messages: ReturnType<typeof useViewMessages>,
): string {
  return messages.label(
    filter.mode === 'advanced' || !filter.simple
      ? 'label.filter.advanced'
      : 'label.filter.simple',
  );
}
