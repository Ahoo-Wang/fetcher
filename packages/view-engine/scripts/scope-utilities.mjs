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

import { fileURLToPath } from 'node:url';
import prefixer from 'postcss-prefix-selector';

/**
 * Keeps every painting rule of the theme inside `.fve-root`.
 *
 * Tailwind's preflight resets `*`, `html`, headings, lists and buttons on the
 * whole page, its utilities are bare classes (`.flex`, `.container`,
 * `.collapse`) a host may share with Bootstrap, and the grid adapter's
 * `.react-grid-*` are bare classes too. Tailwind v4 has no prefix that leaves
 * the vendored components untouched, so `postcss-prefix-selector` rewrites
 * every selector instead. The subject gets `:where(.fve-root, .fve-root *)`
 * rather than a descendant prefix, because a popup carries the root class
 * itself, and `:where` adds no specificity, so the cascade is what the
 * sources produced. A rule whose subject can never be inside the root
 * (`html`) simply stops matching, which is how the host keeps its typography.
 *
 * Left alone: a rule that already names the root, and one that only sets
 * custom properties (Tailwind's `--tw-*` defaults on `*`, the `:root`
 * fallbacks): they paint nothing. The library skips `@keyframes` steps itself.
 *
 * It runs after the Tailwind Vite plugin, which compiles ahead of PostCSS,
 * and only on the theme file: Storybook runs it too, so the stories show the
 * shipped rules, and its other stylesheets must stay as they are.
 */
const THEME = fileURLToPath(new URL('../src/styles.css', import.meta.url));
const PSEUDO_ELEMENT =
  /(?<!\\)(::[\w-]+|:(?:before|after|first-line|first-letter))/;

export function scopeUtilities(root = '.fve-root') {
  const scope = `:where(${root}, ${root} *)`;
  return prefixer({
    prefix: root,
    includeFiles: [THEME],
    transform(_prefix, selector, _prefixed, _file, rule) {
      if (selector.includes(root)) return selector;
      const paints = rule.nodes.some(
        node => node.type === 'decl' && !node.prop.startsWith('--'),
      );
      if (!paints) return selector;
      const at = selector.search(PSEUDO_ELEMENT);
      return at < 0
        ? selector + scope
        : selector.slice(0, at) + scope + selector.slice(at);
    },
  });
}
