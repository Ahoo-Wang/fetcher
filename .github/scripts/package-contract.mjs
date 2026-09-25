/*
 * Copyright [2021-present] [ahoo wang <ahoowang@qq.com> (https://github.com/Ahoo-Wang)].
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may obtain a copy at http://www.apache.org/licenses/LICENSE-2.0
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { builtinModules } from 'node:module';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

/**
 * Checks that what each published package declares matches what it does:
 *
 * 1. Every package its source imports is a dependency or peer, and every
 *    dependency or peer is imported (a peer nobody imports still has to be
 *    installed by every consumer).
 * 2. Peers on packages of this repository use `workspace:^`, which publishing
 *    turns into the version released with them; a pinned `workspace:^5.0.0`
 *    rejects the next major of its own sibling.
 * 3. Every dependency and peer is external in the Vite build, so it is not
 *    bundled next to the copy the consumer installs.
 * 4. UMD global names are unique, and a package that reads a sibling's global
 *    uses the name that sibling's build writes.
 */

const SCOPE = '@ahoo-wang/';
const SOURCE = /\.(?:[cm]?[jt]sx?)$/;
const SKIPPED = /\.(?:test|stories)\.[cm]?[jt]sx?$/;
const IMPORT =
  /(?:\bfrom\s*|\bimport\s*\(?\s*|\brequire\s*\(\s*)['"]([^'"./][^'"]*)['"]/g;
const BUILTINS = new Set(builtinModules);

/** `react/jsx-runtime` → `react`, `@scope/name/sub` → `@scope/name`. */
export function packageName(specifier) {
  const parts = specifier.split('/');
  return specifier.startsWith('@') ? parts.slice(0, 2).join('/') : parts[0];
}

/** Source without comments, so JSDoc examples do not count as imports. */
function stripComments(text) {
  return text.replace(/\/\*[\s\S]*?\*\/|(^|[^:'"`])\/\/.*$/gm, '$1');
}

/** Packages a source text imports (bare specifiers, no builtins). */
export function importedPackages(text) {
  const names = new Set();
  for (const [, specifier] of stripComments(text).matchAll(IMPORT)) {
    if (specifier.startsWith('node:') || BUILTINS.has(specifier)) continue;
    names.add(packageName(specifier));
  }
  return names;
}

/** String literals inside `<key>: [ ... ]` or `<key>: { ... }` of a config. */
function block(config, key, open, close) {
  const start = config.search(new RegExp(`\\b${key}\\s*:\\s*\\${open}`));
  if (start < 0) return '';
  const from = config.indexOf(open, start);
  let depth = 0;
  for (let i = from; i < config.length; i++) {
    if (config[i] === open) depth++;
    else if (config[i] === close && --depth === 0)
      return config.slice(from + 1, i);
  }
  return '';
}

/** The UMD name, externals and globals a Vite library config declares. */
export function viteLibrary(config) {
  const name = config.match(/\bname\s*:\s*'([^']+)'/)?.[1];
  const external = new Set(
    [...block(config, 'external', '[', ']').matchAll(/'([^']+)'/g)].map(
      ([, value]) => value,
    ),
  );
  const globals = Object.fromEntries(
    [
      ...block(config, 'globals', '{', '}').matchAll(
        /'?([@\w/.-]+)'?\s*:\s*'([^']+)'/g,
      ),
    ].map(([, module, global]) => [module, global]),
  );
  return { name, external, globals };
}

function sourceFiles(directory) {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { recursive: true, withFileTypes: true })
    .filter(
      entry =>
        entry.isFile() && SOURCE.test(entry.name) && !SKIPPED.test(entry.name),
    )
    .map(entry => join(entry.parentPath, entry.name));
}

/** Published packages under `packages/`, with what they declare and do. */
export function readPackages(root) {
  const parent = join(root, 'packages');
  return readdirSync(parent, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => join(parent, entry.name))
    .filter(directory => existsSync(join(directory, 'package.json')))
    .map(directory => {
      const manifest = JSON.parse(
        readFileSync(join(directory, 'package.json'), 'utf8'),
      );
      const imports = new Set();
      for (const file of sourceFiles(join(directory, 'src')))
        for (const name of importedPackages(readFileSync(file, 'utf8')))
          imports.add(name);
      imports.delete(manifest.name);
      const config = join(directory, 'vite.config.ts');
      return {
        directory: directory.slice(root.length + 1),
        manifest,
        imports,
        vite: existsSync(config)
          ? viteLibrary(readFileSync(config, 'utf8'))
          : undefined,
      };
    })
    .filter(pkg => !pkg.manifest.private);
}

/** Every mismatch between what the packages declare and what they do. */
export function problems(packages) {
  const found = [];
  const umdNames = new Map();
  for (const pkg of packages) {
    const { directory, manifest, imports, vite } = pkg;
    const declared = {
      ...manifest.dependencies,
      ...manifest.peerDependencies,
    };
    for (const name of imports)
      if (!(name in declared))
        found.push(`${directory}: imports ${name}, which it does not declare`);
    for (const name of Object.keys(declared))
      if (!imports.has(name))
        found.push(
          `${directory}: declares ${name}, which its source never imports`,
        );
    for (const [name, range] of Object.entries(manifest.peerDependencies ?? {}))
      if (name.startsWith(SCOPE) && range !== 'workspace:^')
        found.push(
          `${directory}: peer ${name} is ${range}; use workspace:^ so it follows the release`,
        );
    if (!vite) continue;
    for (const name of Object.keys(declared))
      if (!vite.external.has(name))
        found.push(
          `${directory}: ${name} is not external in vite.config.ts, so it is bundled`,
        );
    if (vite.name) {
      const other = umdNames.get(vite.name);
      if (other)
        found.push(`${directory}: UMD global ${vite.name} is also ${other}'s`);
      umdNames.set(vite.name, directory);
    }
  }
  const globalOf = new Map(
    packages
      .filter(pkg => pkg.vite?.name)
      .map(pkg => [pkg.manifest.name, pkg.vite.name]),
  );
  for (const { directory, vite } of packages)
    for (const [module, global] of Object.entries(vite?.globals ?? {})) {
      const expected = globalOf.get(module);
      if (expected && expected !== global)
        found.push(
          `${directory}: reads ${module} as the global ${global}, but its build writes ${expected}`,
        );
    }
  return found;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const found = problems(readPackages(process.cwd()));
  if (found.length) {
    console.error(found.join('\n'));
    process.exit(1);
  }
  console.log('Package contract: manifests, imports and builds agree.');
}
