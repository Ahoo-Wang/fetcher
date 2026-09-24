/*
 * Copyright [2021-present] [ahoo wang <ahoowang@qq.com> (https://github.com/Ahoo-Wang)].
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may obtain a copy at http://www.apache.org/licenses/LICENSE-2.0
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { pathToFileURL } from 'node:url';

/**
 * Guards for the agent skills in `skills/` (published as a plugin through
 * `skills/plugins.json`). An agent trusts a skill's code verbatim, so every
 * import it shows must name something the package really exports.
 *
 * Exports are read from the **source** export graph: each `exports` entry of a
 * workspace `package.json` points at `./dist/<entry>.d.ts`, which the build
 * emits one-to-one from `src/<entry>.ts` (no d.ts roll-up), so walking
 * `export * from` / `export { … } from` / `export <declaration>` from
 * `src/<entry>.ts` yields the same names as the built declarations. Unlike
 * reading `dist/`, it needs neither `pnpm install` nor a build, so it runs in
 * Engineering Quality's first step, which comes before both — and on a
 * skills-only change, which never builds packages.
 *
 * Runs in Engineering Quality via `node --test .github/scripts/*.test.mjs`.
 */

/** The only skill that may name packages this repository does not publish. */
export const MIGRATION_SKILL = 'fetcher-v6-migration';
/** Packages that left fetcher in 6.0; allowed only in the migration skill. */
export const FORMER_PACKAGES = new Set([
  '@ahoo-wang/fetcher-wow',
  '@ahoo-wang/fetcher-generator',
  '@ahoo-wang/fetcher-viewer',
  '@ahoo-wang/fetcher-view-engine',
]);
/** Replacements in the Wow repository, not on npm yet. */
export const EXTERNAL_PACKAGE = /^@ahoo-wang\/wow-[a-z-]*$/;
/** The migration skill must say the Wow packages are not published yet. */
export const NOT_ON_NPM = /not (?:yet )?(?:on npm|published)|not on npm yet/i;
export const DESCRIPTION_MAX_WORDS = 60;
export const DESCRIPTION_MAX_CHARS = 1024;
/**
 * What `@ahoo-wang/fetcher-react` stopped exporting in 6.0
 * (`docs/releases/v6.0.0.md`, checked against the v5.1.3 sources): the Wow
 * query hooks, now in `@ahoo-wang/wow-react`, and the data-monitor hooks,
 * which have no replacement. Only the migration skill may name them, and it
 * must name every one.
 */
export const REMOVED_REACT_EXPORTS = [
  ...['Single', 'List', 'Paged', 'Count', 'ListStream'].flatMap(kind => [
    `use${kind}Query`,
    `Use${kind}QueryOptions`,
    `Use${kind}QueryReturn`,
    `useFetcher${kind}Query`,
    `UseFetcher${kind}QueryOptions`,
    `UseFetcher${kind}QueryReturn`,
  ]),
  'useDataMonitor',
  'UseDataMonitorOptions',
  'UseDataMonitorReturn',
  'DataMonitorService',
  'dataMonitorService',
  'DataMonitorNotificationConfig',
  'useDataMonitorEventBus',
  'UseDataMonitorEventBusReturn',
  'DataChangedEvent',
  'dataMonitorEventBus',
];
/** Platform names a SKILL.md may put in backticks without a package export. */
const PLATFORM_NAMES = new Set([
  'AbortController',
  'Authorization',
  'DOMException',
  'Number',
  'Storage',
  'SyntaxError',
  'AbortSignal',
  'Blob',
  'BroadcastChannel',
  'Error',
  'EventSource',
  'FormData',
  'Headers',
  'JSON',
  'Partial',
  'Promise',
  'ReadableStream',
  'Record',
  'Request',
  'RequestInit',
  'Response',
  'TextDecoder',
  'TypeError',
  'URL',
  'URLSearchParams',
]);
/** A backticked name that reads like an API symbol, not prose. */
const SYMBOL_LIKE =
  /^(?:[A-Z][A-Za-z0-9]*[a-z][A-Za-z0-9]*|[A-Z][A-Z0-9]*_[A-Z0-9_]+|use[A-Z]\w*|create[A-Z]\w*)$/;

const PACKAGE_MENTION = /@ahoo-wang\/[a-z0-9-]+(?:\/[a-zA-Z0-9_/-]+)?/g;
const SKILL_LINK = /(?<![\w$])\$([a-z][a-z0-9]*(?:-[a-z0-9]+)+)\b/g;
const NAMED_IMPORT =
  /\bimport\s+(?:type\s+)?(?:([A-Za-z_$][\w$]*)\s*,\s*)?\{([^}]*)\}\s*from\s*['"](@ahoo-wang\/[^'"]+)['"]/g;
const DEFAULT_IMPORT =
  /\bimport\s+(?:type\s+)?([A-Za-z_$][\w$]*)\s+from\s*['"](@ahoo-wang\/[^'"]+)['"]/g;

// ---------------------------------------------------------------- YAML subset

/**
 * Parses the YAML subset skills use: nested mappings by indentation, plain or
 * quoted scalars and `>` / `|` block scalars. Anything else throws, so a
 * malformed file fails loudly instead of being half-read.
 */
export function parseYaml(text) {
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  const root = {};
  const stack = [{ indent: -1, value: root }];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^\s*(?:#.*)?$/.test(line)) continue;
    const match = line.match(/^( *)([A-Za-z_][\w-]*):(?: +(.*))?$/);
    if (!match) throw new Error(`line ${i + 1}: unsupported YAML: ${line}`);
    const [, spaces, key, rawValue = ''] = match;
    const indent = spaces.length;
    while (stack.at(-1).indent >= indent) stack.pop();
    const parent = stack.at(-1).value;
    if (Object.hasOwn(parent, key))
      throw new Error(`line ${i + 1}: duplicate key ${key}`);
    const value = rawValue.replace(/\s+#.*$/, '').trim();
    if (value === '') {
      parent[key] = {};
      stack.push({ indent, value: parent[key] });
    } else if (/^[>|][-+]?$/.test(value)) {
      const block = [];
      let blockIndent;
      while (i + 1 < lines.length) {
        const next = lines[i + 1];
        const nextIndent = next.match(/^ */)[0].length;
        if (next.trim() !== '' && nextIndent <= indent) break;
        blockIndent ??= next.trim() === '' ? undefined : nextIndent;
        block.push(next.slice(blockIndent ?? 0));
        i++;
      }
      while (block.length && block.at(-1).trim() === '') block.pop();
      parent[key] =
        value[0] === '|'
          ? block.join('\n')
          : block
              .join('\n')
              .replace(/([^\n])\n(?=[^\n])/g, '$1 ')
              .trim();
    } else {
      parent[key] = scalar(value, i + 1);
    }
  }
  return root;
}

function scalar(value, line) {
  if (value.startsWith("'")) {
    if (!/^'(?:[^']|'')*'$/.test(value))
      throw new Error(`line ${line}: unterminated quoted scalar`);
    return value.slice(1, -1).replace(/''/g, "'");
  }
  if (value.startsWith('"')) return JSON.parse(value);
  if (/^[[{&*!|>@`]/.test(value))
    throw new Error(`line ${line}: unsupported YAML value: ${value}`);
  return value;
}

/** Splits `---` frontmatter from a Markdown file. */
export function frontmatter(markdown) {
  const match = markdown.match(/^---\n([\s\S]*?)\n---\n/);
  if (!match) throw new Error('missing --- frontmatter');
  return { data: parseYaml(match[1]), body: markdown.slice(match[0].length) };
}

// ------------------------------------------------------- package export graph

/** Workspace packages: name → { dir, entries: subpath → source entry }. */
export function workspacePackages(root) {
  const packages = new Map();
  const base = join(root, 'packages');
  if (!existsSync(base)) return packages;
  for (const entry of readdirSync(base, { withFileTypes: true })) {
    const manifest = join(base, entry.name, 'package.json');
    if (!entry.isDirectory() || !existsSync(manifest)) continue;
    const pkg = JSON.parse(readFileSync(manifest, 'utf8'));
    const dir = join(base, entry.name);
    const entries = new Map();
    const exportsMap = pkg.exports ?? { '.': { types: pkg.types } };
    for (const [subpath, target] of Object.entries(exportsMap)) {
      const types = typeof target === 'string' ? target : target?.types;
      if (typeof types !== 'string' || !types.endsWith('.d.ts')) continue;
      const source = types
        .replace(/^\.\/dist\//, 'src/')
        .replace(/\.d\.ts$/, '.ts');
      entries.set(subpath, join(dir, source));
    }
    packages.set(pkg.name, { dir, entries });
  }
  return packages;
}

function resolveModule(fromFile, specifier) {
  const base = join(dirname(fromFile), specifier.replace(/\.[cm]?js$/, ''));
  for (const candidate of [
    `${base}.ts`,
    `${base}.tsx`,
    `${base}.d.ts`,
    join(base, 'index.ts'),
    join(base, 'index.tsx'),
  ])
    if (existsSync(candidate) && statSync(candidate).isFile()) return candidate;
  throw new Error(
    `cannot resolve '${specifier}' from ${relative(process.cwd(), fromFile)}`,
  );
}

function stripComments(source) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:'"`\\])\/\/.*$/gm, '$1');
}

function exportedAliases(list) {
  return list
    .split(',')
    .map(part => part.trim().replace(/^type\s+/, ''))
    .filter(Boolean)
    .map(part =>
      part
        .split(/\s+as\s+/)
        .at(-1)
        .trim(),
    );
}

/**
 * Names exported by a TypeScript module, following `export *` through
 * relative re-exports (a star re-export skips `default`, as in ECMAScript).
 */
export function moduleExports(file, seen = new Map()) {
  if (seen.has(file)) return seen.get(file);
  const names = new Set();
  seen.set(file, names);
  const source = stripComments(readFileSync(file, 'utf8'));
  for (const [, alias, specifier] of source.matchAll(
    /^\s*export\s+\*(?:\s+as\s+([\w$]+))?\s+from\s+['"]([^'"]+)['"]/gm,
  )) {
    if (alias) {
      names.add(alias);
    } else if (specifier.startsWith('.')) {
      const target = resolveModule(file, specifier);
      for (const name of moduleExports(target, seen))
        if (name !== 'default') names.add(name);
    } else {
      throw new Error(`unsupported bare re-export '${specifier}' in ${file}`);
    }
  }
  for (const [, list] of source.matchAll(
    /^\s*export\s+(?:type\s+)?\{([^}]*)\}/gm,
  ))
    for (const name of exportedAliases(list)) names.add(name);
  for (const [, name] of source.matchAll(
    /^\s*export\s+(?:declare\s+)?(?:abstract\s+)?(?:async\s+)?(?:const\s+enum|const|let|var|function\*?|class|interface|type|enum|namespace)\s+([\w$]+)/gm,
  ))
    names.add(name);
  if (/^\s*export\s+default\b/m.test(source)) names.add('default');
  return names;
}

// ------------------------------------------------------------------- checks

/**
 * The Markdown with the removed (`-`) lines of every ```diff block dropped:
 * a diff shows the old code on purpose, so only its new side is checked.
 */
function currentCode(markdown) {
  return markdown.replace(/^```diff[^\n]*\n([\s\S]*?)^```/gm, (_, body) =>
    body
      .split('\n')
      .filter(line => !line.startsWith('-'))
      .map(line => line.replace(/^[+ ]/, ''))
      .join('\n'),
  );
}

function splitSpecifier(specifier) {
  const [scope, name, ...rest] = specifier.split('/');
  return {
    pkg: `${scope}/${name}`,
    subpath: rest.length ? `./${rest.join('/')}` : '.',
  };
}

function markdownFiles(skillDir) {
  const files = [join(skillDir, 'SKILL.md')];
  const references = join(skillDir, 'references');
  if (existsSync(references))
    for (const name of readdirSync(references).sort())
      if (name.endsWith('.md')) files.push(join(references, name));
  return files.filter(file => existsSync(file));
}

/** Every problem with the skills under `root/skills`, as readable lines. */
export function skillProblems(root) {
  const problems = [];
  const skillsDir = join(root, 'skills');
  const packages = workspacePackages(root);
  const exportCache = new Map();
  const skills = readdirSync(skillsDir, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name)
    .sort();
  const skillSet = new Set(skills);
  let allExports;
  const exportedAnywhere = name => {
    if (!allExports) {
      allExports = new Set();
      for (const [, { entries }] of packages)
        for (const [, source] of entries)
          for (const exported of moduleExports(source))
            allExports.add(exported);
    }
    return allExports.has(name);
  };

  const exportsOf = (pkg, subpath) => {
    const key = `${pkg}${subpath}`;
    if (!exportCache.has(key))
      exportCache.set(
        key,
        moduleExports(packages.get(pkg).entries.get(subpath)),
      );
    return exportCache.get(key);
  };

  for (const skill of skills) {
    const dir = join(skillsDir, skill);
    const report = (file, message) =>
      problems.push(`skills/${skill}/${file}: ${message}`);

    for (const required of [
      'SKILL.md',
      'references/api.md',
      'agents/openai.yaml',
      'evals/evals.json',
    ])
      if (!existsSync(join(dir, required))) report(required, 'missing');
    if (!existsSync(join(dir, 'SKILL.md'))) continue;

    // Frontmatter: the description is all an agent sees before loading.
    let body = '';
    try {
      const parsed = frontmatter(readFileSync(join(dir, 'SKILL.md'), 'utf8'));
      body = parsed.body;
      if (parsed.data.name !== skill)
        report('SKILL.md', `name '${parsed.data.name}' ≠ directory '${skill}'`);
      const description = parsed.data.description;
      if (typeof description !== 'string' || description.trim() === '')
        report('SKILL.md', 'description is empty');
      else {
        const words = description.trim().split(/\s+/).length;
        if (words > DESCRIPTION_MAX_WORDS)
          report(
            'SKILL.md',
            `description has ${words} words (budget ${DESCRIPTION_MAX_WORDS})`,
          );
        if (description.length > DESCRIPTION_MAX_CHARS)
          report(
            'SKILL.md',
            `description has ${description.length} characters (budget ${DESCRIPTION_MAX_CHARS})`,
          );
      }
    } catch (error) {
      report('SKILL.md', `frontmatter: ${error.message}`);
    }

    // Backticked API names in SKILL.md must be real exports (or platform
    // names, or names the skill's own examples declare).
    const declared = new Set(
      [
        ...body.matchAll(
          /\b(?:class|interface|type|enum|function|const|let)\s+([A-Za-z_$][\w$]*)/g,
        ),
      ].map(([, name]) => name),
    );
    const removed = new Set(REMOVED_REACT_EXPORTS);
    for (const [, raw] of body.matchAll(/`([^`\n]+)`/g)) {
      const name = raw.replace(/\(.*\)$/, '').split('.')[0];
      if (!SYMBOL_LIKE.test(name) || PLATFORM_NAMES.has(name)) continue;
      if (declared.has(name) || exportedAnywhere(name)) continue;
      if (skill === MIGRATION_SKILL && removed.has(name)) continue;
      report('SKILL.md', `\`${raw}\` is not exported by any package here`);
    }
    if (skill === MIGRATION_SKILL)
      for (const name of REMOVED_REACT_EXPORTS) {
        if (exportedAnywhere(name))
          report('SKILL.md', `${name} is listed as removed but is exported`);
        if (!new RegExp(`\\b${name}\\b`).test(body))
          report('SKILL.md', `removed export ${name} is not listed`);
      }

    // Files the body points at must ship with the skill.
    for (const [, path] of body.matchAll(
      /`((?:references|agents|evals|scripts|assets)\/[^`\s]+)`/g,
    ))
      if (!existsSync(join(dir, path))) report('SKILL.md', `${path} not found`);
    for (const [, path] of body.matchAll(/\]\((?!https?:|#)([^)\s]+)\)/g))
      if (!existsSync(join(dir, path.split('#')[0])))
        report('SKILL.md', `link ${path} not found`);

    // agents/openai.yaml
    const yamlFile = join(dir, 'agents/openai.yaml');
    if (existsSync(yamlFile))
      try {
        const yaml = parseYaml(readFileSync(yamlFile, 'utf8'));
        for (const field of [
          'display_name',
          'short_description',
          'default_prompt',
        ])
          if (typeof yaml.interface?.[field] !== 'string')
            report('agents/openai.yaml', `interface.${field} missing`);
        if (!yaml.interface?.default_prompt?.includes(`$${skill}`))
          report(
            'agents/openai.yaml',
            `interface.default_prompt does not name $${skill}`,
          );
      } catch (error) {
        report('agents/openai.yaml', error.message);
      }

    // evals/evals.json
    const evalsFile = join(dir, 'evals/evals.json');
    if (existsSync(evalsFile))
      try {
        const evals = JSON.parse(readFileSync(evalsFile, 'utf8'));
        if (evals.skill_name !== skill)
          report(
            'evals/evals.json',
            `skill_name '${evals.skill_name}' ≠ '${skill}'`,
          );
        if (
          !Array.isArray(evals.evals) ||
          evals.evals.length < 3 ||
          evals.evals.length > 5
        )
          report('evals/evals.json', 'needs 3–5 evals');
        const ids = new Set();
        for (const [index, item] of (evals.evals ?? []).entries()) {
          if (ids.has(item.id))
            report('evals/evals.json', `duplicate id ${item.id}`);
          ids.add(item.id);
          for (const field of ['prompt', 'expected_output'])
            if (typeof item[field] !== 'string' || item[field].trim() === '')
              report('evals/evals.json', `evals[${index}].${field} is empty`);
          if (!Array.isArray(item.files))
            report('evals/evals.json', `evals[${index}].files is not a list`);
        }
      } catch (error) {
        report('evals/evals.json', error.message);
      }

    const texts = markdownFiles(dir).map(file => ({
      file: relative(dir, file),
      text: readFileSync(file, 'utf8'),
    }));
    if (existsSync(yamlFile))
      texts.push({
        file: 'agents/openai.yaml',
        text: readFileSync(yamlFile, 'utf8'),
      });

    let mentionsExternal = false;
    for (const { file, text } of texts) {
      // $skill links
      for (const [, link] of text.matchAll(SKILL_LINK))
        if (!skillSet.has(link)) report(file, `$${link} is not a skill here`);

      // Every @ahoo-wang/* name must be a package (and subpath) we publish,
      // except in the migration skill, which describes where they went.
      for (const [mention] of text.matchAll(PACKAGE_MENTION)) {
        const { pkg, subpath } = splitSpecifier(mention);
        if (packages.has(pkg)) continue;
        const external = EXTERNAL_PACKAGE.test(pkg);
        if (external) mentionsExternal = true;
        // `@ahoo-wang/fetcher-(wow|…)` in a grep pattern is a prefix, not a name.
        if (!external && pkg.endsWith('-')) continue;
        if (skill === MIGRATION_SKILL && (external || FORMER_PACKAGES.has(pkg)))
          continue;
        report(
          file,
          `${pkg}${subpath === '.' ? '' : subpath.slice(1)} is not published from this repository` +
            (external || FORMER_PACKAGES.has(pkg)
              ? ` (only $${MIGRATION_SKILL} may name it)`
              : ''),
        );
      }

      if (!file.endsWith('.md')) continue;
      {
        const code = currentCode(text);
        const imports = [];
        for (const [, defaultName, list, specifier] of code.matchAll(
          NAMED_IMPORT,
        )) {
          if (defaultName) imports.push({ specifier, names: ['default'] });
          imports.push({
            specifier,
            names: stripComments(list)
              .split(',')
              .map(part => part.trim().replace(/^type\s+/, ''))
              .filter(part => part && !/^(?:\.\.\.|…)$/.test(part))
              .map(part => part.split(/\s+as\s+/)[0].trim()),
          });
        }
        for (const [, , specifier] of code.matchAll(DEFAULT_IMPORT))
          imports.push({ specifier, names: ['default'] });
        for (const { specifier, names } of imports) {
          const { pkg, subpath } = splitSpecifier(specifier);
          if (!packages.has(pkg)) continue; // reported as a mention above
          if (!packages.get(pkg).entries.has(subpath)) {
            report(file, `import from '${specifier}': no such entry point`);
            continue;
          }
          const exported = exportsOf(pkg, subpath);
          for (const name of names)
            if (!exported.has(name))
              report(
                file,
                `import { ${name} } from '${specifier}': not exported`,
              );
        }
      }
    }

    if (skill === MIGRATION_SKILL && mentionsExternal && !NOT_ON_NPM.test(body))
      report(
        'SKILL.md',
        'names @ahoo-wang/wow-* but never says they are not on npm yet',
      );
  }

  if (!skillSet.has(MIGRATION_SKILL))
    problems.push(`skills/${MIGRATION_SKILL}: missing`);
  return problems;
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const problems = skillProblems(process.argv[2] ?? process.cwd());
  if (problems.length > 0) {
    console.error(problems.map(line => `  ${line}`).join('\n'));
    process.exit(1);
  }
  console.log('Skills: frontmatter, links, evals and imports are consistent.');
}
