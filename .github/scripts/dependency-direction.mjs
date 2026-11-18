/*
 * Copyright [2021-present] [ahoo wang <ahoowang@qq.com> (https://github.com/Ahoo-Wang)].
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may obtain a copy at http://www.apache.org/licenses/LICENSE-2.0
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

/**
 * Dependencies run one way only: Wow → fetcher and CoSec → fetcher. The Wow
 * packages (`@ahoo-wang/wow-*`, in the Wow repository under `typescript/`) and
 * the CoSec clients (`@ahoo-wang/cosec-*`, in the CoSec repository under
 * `typescript/`, which replaced `@ahoo-wang/fetcher-cosec`) depend on the
 * published fetcher packages; nothing here may depend on them, or the
 * repositories would have to release in lockstep.
 */
export const FORBIDDEN = /^@ahoo-wang\/(?:wow-|cosec-|fetcher-cosec(?:\/|$))/;
const DEPENDENCY_FIELDS = [
  'dependencies',
  'devDependencies',
  'peerDependencies',
  'optionalDependencies',
];
const SOURCE = /\.(?:[cm]?[jt]sx?)$/;
const DOCUMENT = /\.(?:[cm]?[jt]sx?|mdx?)$/;
const IMPORT =
  /(?:\bfrom\s*|\bimport\s*\(?\s*|\brequire\s*\(\s*)['"](@ahoo-wang\/[^'"]*)['"]/g;
const CATALOG = /^\s+['"]?(@ahoo-wang\/[^'":]+)/gm;
/**
 * Packages this repository no longer publishes. Beyond importing them, a page
 * must not tell readers to install them, unless it applies to the 5.x line
 * only (its `::: warning … 5.x …` banner): those pages document 5.x as it was.
 */
export const REMOVED = /@ahoo-wang\/fetcher-cosec(?![\w-])/;
const INSTALL =
  /\b(?:pnpm|npm|yarn|bun)\s+(?:add|install|i)\b(?:[^\n]*\\\n)*[^\n]*/g;
const FIVE_X_ONLY = /^::: warning [^\n]*5\.x/m;
/**
 * Examples users copy: the wiki (pages and example sources), the Storybook
 * stories, the agent skills and every README. Release notes and design
 * history under `docs/` record what was, and migration guides (a directory
 * named `*migration*`) name the successor packages on purpose, so neither is
 * checked.
 */
const DOCUMENTATION = ['wiki', 'stories', 'skills'];
const MIGRATION = /[/\\][^/\\]*migration[^/\\]*[/\\]/;
const SKIPPED = /[/\\](?:node_modules|dist|cache|\.vitepress[/\\]dist)[/\\]/;

/** Workspace globs from pnpm-workspace.yaml: `dir/*` or a plain directory. */
function workspaceDirectories(root) {
  const yaml = readFileSync(join(root, 'pnpm-workspace.yaml'), 'utf8');
  const block = yaml.match(/^packages:\n((?:[ \t]+-.*\n?)+)/m)?.[1] ?? '';
  const directories = [];
  for (const [, raw] of block.matchAll(/-\s*['"]?([^'"\n]+?)['"]?\s*$/gm)) {
    if (raw.endsWith('/*')) {
      const parent = join(root, raw.slice(0, -2));
      if (!existsSync(parent)) continue;
      for (const entry of readdirSync(parent, { withFileTypes: true }))
        if (entry.isDirectory())
          directories.push(join(raw.slice(0, -2), entry.name));
    } else directories.push(raw);
  }
  return directories;
}

function files(directory, pattern, recursive = true) {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { recursive, withFileTypes: true })
    .filter(entry => entry.isFile() && pattern.test(entry.name))
    .map(entry => join(entry.parentPath, entry.name))
    .filter(file => !SKIPPED.test(file));
}

function readmes(directory) {
  return files(directory, /^README(?:\.[\w-]+)?\.md$/, false);
}

function imports(root, file) {
  const found = [];
  const where = file.slice(root.length + 1);
  const text = readFileSync(file, 'utf8');
  for (const [, specifier] of text.matchAll(IMPORT))
    if (FORBIDDEN.test(specifier)) found.push(`${where} imports ${specifier}`);
  if (/\.mdx?$/.test(file) && !FIVE_X_ONLY.test(text))
    for (const [command] of text.matchAll(INSTALL)) {
      const name = command.match(REMOVED)?.[0];
      if (name) found.push(`${where} installs ${name}`);
    }
  return found;
}

/** Every place in the repository at `root` that depends on a Wow or CoSec package. */
export function violations(root) {
  const found = [];
  const directories = ['', ...workspaceDirectories(root)];
  for (const directory of directories) {
    const manifest = join(root, directory, 'package.json');
    if (!existsSync(manifest)) continue;
    const pkg = JSON.parse(readFileSync(manifest, 'utf8'));
    const where = join(directory, 'package.json');
    for (const field of DEPENDENCY_FIELDS)
      for (const name of Object.keys(pkg[field] ?? {}))
        if (FORBIDDEN.test(name)) found.push(`${where} ${field}: ${name}`);
    for (const name of Object.keys(pkg.pnpm?.overrides ?? {}))
      if (FORBIDDEN.test(name.replace(/@[^@/]*$/, '')))
        found.push(`${where} pnpm.overrides: ${name}`);
    for (const file of readmes(join(root, directory)))
      found.push(...imports(root, file));
    if (directory === '') continue;
    for (const file of files(join(root, directory, 'src'), SOURCE))
      found.push(...imports(root, file));
  }
  for (const directory of DOCUMENTATION)
    for (const file of files(join(root, directory), DOCUMENT))
      if (!MIGRATION.test(file.slice(root.length)))
        found.push(...imports(root, file));
  const yaml = readFileSync(join(root, 'pnpm-workspace.yaml'), 'utf8');
  for (const [, name] of yaml.matchAll(CATALOG))
    if (FORBIDDEN.test(name))
      found.push(`pnpm-workspace.yaml catalog: ${name}`);
  return found;
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const found = violations(process.argv[2] ?? process.cwd());
  if (found.length > 0) {
    console.error(
      'Dependencies run one way, Wow → fetcher and CoSec → fetcher: nothing ' +
        'in this repository may depend on @ahoo-wang/wow-*, @ahoo-wang/cosec-* ' +
        'or @ahoo-wang/fetcher-cosec.\n' +
        found.map(line => `  ${line}`).join('\n'),
    );
    process.exit(1);
  }
  console.log(
    'Dependency direction: nothing depends on @ahoo-wang/wow-*, ' +
      '@ahoo-wang/cosec-* or @ahoo-wang/fetcher-cosec.',
  );
}
