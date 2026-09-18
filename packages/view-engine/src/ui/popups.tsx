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

import type * as React from 'react';
import { createContext, useContext } from 'react';
import { cn } from 'cn';
import * as Dialog from './components/dialog.js';
import * as Menu from './components/dropdown-menu.js';
import * as Popover from './components/popover.js';
import * as Select from './components/select.js';
import * as Tooltip from './components/tooltip.js';

/** The `theme` of the nearest `ViewSurface`, for what renders outside it. */
export const SurfaceTheme = createContext<'light' | 'dark' | undefined>(
  undefined,
);

/**
 * A registry popup that carries the surface's theme with it.
 *
 * Every popup portals to `document.body`, out of `.fve-root`, where all the
 * tokens live, so it resolved none of them: a transparent menu drawn over the
 * table, in either theme. Here the popup element becomes a `.fve-root` of its
 * own, with the surface's `data-theme`, and resolves the same tokens where it
 * is. It stays under the body, where no `overflow` of the host's can clip it,
 * and the host page is still untouched.
 *
 * Wrapping here rather than in `components/` keeps those files as upstream
 * ships them, which is what lets `shadcn add --diff` update them.
 */
function scoped<P extends object>(Popup: (props: P) => React.ReactNode) {
  return function ScopedPopup(props: P) {
    const theme = useContext(SurfaceTheme);
    const className = withRoot((props as { className?: unknown }).className);
    return <Popup {...{ ...props, className }} data-theme={theme} />;
  };
}

/**
 * `fve-root` added to a Base UI `className`, which is a string or a function
 * of the popup's state; the function form keeps working as one.
 */
function withRoot(className: unknown) {
  if (typeof className !== 'function')
    return cn('fve-root', className as string | undefined);
  const byState = className as (state: unknown) => string | undefined;
  return (state: unknown) => cn('fve-root', byState(state));
}

export const DialogContent = scoped(Dialog.DialogContent);
export const DropdownMenuContent = scoped(Menu.DropdownMenuContent);
export const DropdownMenuSubContent = scoped(Menu.DropdownMenuSubContent);
export const PopoverContent = scoped(Popover.PopoverContent);
export const SelectContent = scoped(Select.SelectContent);
export const TooltipContent = scoped(Tooltip.TooltipContent);
