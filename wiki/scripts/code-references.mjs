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

import { readFileSync, realpathSync } from 'node:fs';
import { resolve, relative, isAbsolute, extname, sep } from 'node:path';

// Only full-file references used by this wiki are supported.
export function expandCodeReferences(content, page, wikiDir) {
  const root = realpathSync(resolve(wikiDir, '..'));
  return content.replace(/^<<< (.+)$/gm, (_, reference) => {
    const target = resolve(wikiDir, reference.slice(2));
    const fail = reason =>
      new Error(`${page}: code reference ${reference} (${target}): ${reason}`);
    if (!/^@\/[^\s{}#]+$/.test(reference)) throw fail('unsupported reference');
    const inside = path => {
      const rel = relative(root, path);
      return rel !== '..' && !rel.startsWith('..' + sep) && !isAbsolute(rel);
    };
    if (!inside(target)) throw fail('outside repository');
    let actual;
    try {
      actual = realpathSync(target);
    } catch {
      throw fail('missing target');
    }
    if (!inside(actual)) throw fail('symlink outside repository');
    let code;
    try {
      code = readFileSync(actual, 'utf8').trimEnd();
    } catch {
      throw fail('unreadable target');
    }
    const language = extname(target).slice(1).replace(/^mjs$/, 'javascript');
    const fence = '`'.repeat(
      Math.max(
        3,
        ...[...code.matchAll(/`+/g)].map(match => match[0].length + 1),
      ),
    );
    return `${fence}${language}\n${code}\n${fence}`;
  });
}
