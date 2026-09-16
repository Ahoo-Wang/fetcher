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

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/**
 * Dependency rules from docs/design.md §4. Each layer lists the layers it may
 * import. `ui` may import everything; layers absent from `src/` pass trivially,
 * so the rules hold from the empty tree onwards.
 */
const LAYERS = [
  'model',
  'filter',
  'record',
  'analysis',
  'dashboard',
  'runtime',
  'store',
  'react',
  'ui',
] as const;
type Layer = (typeof LAYERS)[number];

const ALLOWED: Record<Layer, readonly Layer[]> = {
  model: [],
  filter: ['model'],
  record: ['model', 'filter'],
  analysis: ['model', 'filter'],
  dashboard: ['model', 'filter'],
  runtime: ['model', 'filter', 'record', 'analysis', 'dashboard', 'store'],
  store: ['model'],
  react: [
    'model',
    'filter',
    'record',
    'analysis',
    'dashboard',
    'runtime',
    'store',
  ],
  ui: [...LAYERS],
};

/** Layers that must stay free of React and the DOM. */
const HEADLESS: readonly Layer[] = [
  'model',
  'filter',
  'record',
  'analysis',
  'dashboard',
  'runtime',
  'store',
];

/** Third-party packages and the only layers allowed to import them. */
const THIRD_PARTY: Record<string, readonly Layer[]> = {
  '@ahoo-wang/fetcher-wow': [
    'model',
    'filter',
    'record',
    'analysis',
    'runtime',
  ],
  '@tanstack/react-table': ['ui'],
  recharts: ['ui'],
  'react-grid-layout': ['ui'],
  'react-markdown': ['ui'],
  '@base-ui/react': ['ui'],
  'lucide-react': ['ui'],
};

/** Wow APIs marked `@deprecated` in favor of `FilterExpression` and `Filter*Query`. */
const DEPRECATED_WOW_SYMBOLS = [
  'Condition',
  'ConditionOptions',
  'ConditionOptionKey',
  'isValidateCondition',
  'PagedQuery',
  'ListQuery',
  'SingleQuery',
];

const src = resolve(dirname(fileURLToPath(import.meta.url)), '../src');

interface SourceFile {
  path: string;
  layer: Layer | 'root';
  text: string;
  imports: string[];
}

function walk(directory: string): string[] {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return walk(path);
    return /\.(ts|tsx)$/.test(entry.name) && !/\.test\./.test(entry.name)
      ? [path]
      : [];
  });
}

function layerOf(path: string): Layer | 'root' {
  const [first] = relative(src, path).split(sep);
  return (LAYERS as readonly string[]).includes(first)
    ? (first as Layer)
    : 'root';
}

function importsOf(text: string): string[] {
  const specifiers: string[] = [];
  const pattern =
    /(?:^|\n)\s*(?:import|export)\s[^'"\n]*?from\s*['"]([^'"]+)['"]|(?:^|\n)\s*import\s*['"]([^'"]+)['"]/g;
  for (const match of text.matchAll(pattern))
    specifiers.push(match[1] ?? match[2]);
  return specifiers;
}

function load(): SourceFile[] {
  return walk(src).map(path => {
    const text = readFileSync(path, 'utf8');
    return { path, layer: layerOf(path), text, imports: importsOf(text) };
  });
}

function targetLayer(
  from: SourceFile,
  specifier: string,
): Layer | 'root' | null {
  if (specifier.startsWith('.')) {
    return layerOf(resolve(dirname(from.path), specifier));
  }
  if (specifier.startsWith('@/')) {
    return layerOf(resolve(src, specifier.slice(2)));
  }
  return null;
}

const files = load();
const describeLayer = (layer: Layer) =>
  files.filter(file => file.layer === layer);

describe('architecture', () => {
  it('has a root entry', () => {
    expect(existsSync(join(src, 'index.ts'))).toBe(true);
  });

  it('places every source file in a known layer or at the root', () => {
    const misplaced = files
      .filter(file => file.layer === 'root')
      .map(file => relative(src, file.path))
      .filter(path => path.includes(sep));
    expect(misplaced).toEqual([]);
  });

  it.each(LAYERS)('%s imports only the layers it is allowed to', layer => {
    const violations = describeLayer(layer).flatMap(file =>
      file.imports
        .map(specifier => [specifier, targetLayer(file, specifier)] as const)
        .filter(
          ([, target]) =>
            target !== null &&
            target !== layer &&
            !(ALLOWED[layer] as readonly string[]).includes(target),
        )
        .map(([specifier]) => `${relative(src, file.path)} -> ${specifier}`),
    );
    expect(violations).toEqual([]);
  });

  it('keeps the root entry free of react and ui', () => {
    const violations = files
      .filter(file => file.layer === 'root')
      .flatMap(file =>
        file.imports
          .map(specifier => targetLayer(file, specifier))
          .filter(target => target === 'react' || target === 'ui'),
      );
    expect(violations).toEqual([]);
  });

  it.each(HEADLESS)('%s is free of React and the DOM', layer => {
    const violations = describeLayer(layer).flatMap(file => {
      const found: string[] = [];
      for (const specifier of file.imports)
        if (/^react(-dom)?(\/|$)/.test(specifier))
          found.push(`${relative(src, file.path)} imports ${specifier}`);
      if (/\b(window|document|navigator|localStorage)\./.test(file.text))
        found.push(`${relative(src, file.path)} touches the DOM`);
      return found;
    });
    expect(violations).toEqual([]);
  });

  it.each(Object.entries(THIRD_PARTY))(
    '%s is imported only from its designated layers',
    (name, layers) => {
      const violations = files
        .filter(
          file =>
            file.layer !== 'root' &&
            !(layers as readonly string[]).includes(file.layer) &&
            file.imports.some(
              specifier =>
                specifier === name || specifier.startsWith(`${name}/`),
            ),
        )
        .map(file => relative(src, file.path));
      expect(violations).toEqual([]);
    },
  );

  it('never imports deprecated Wow condition APIs', () => {
    const pattern = new RegExp(
      `import\\s+(?:type\\s+)?\\{([^}]*)\\}\\s+from\\s+['"]@ahoo-wang/fetcher-wow['"]`,
      'g',
    );
    const violations = files.flatMap(file =>
      [...file.text.matchAll(pattern)].flatMap(match =>
        match[1]
          .split(',')
          .map(
            name =>
              name
                .trim()
                .replace(/^type\s+/, '')
                .split(/\s+as\s+/)[0],
          )
          .filter(name => DEPRECATED_WOW_SYMBOLS.includes(name))
          .map(name => `${relative(src, file.path)} imports ${name}`),
      ),
    );
    expect(violations).toEqual([]);
  });
});
