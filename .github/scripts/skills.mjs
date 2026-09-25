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
 * Eval suites (`evals/<case>/prompt.md` + `graders/*.md`) are only checked for
 * shape here; running them costs money and needs a login, so that is the
 * local `pnpm eval:skills` (`scripts/eval-skills.mjs`), never CI.
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
  'Date',
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
  // A flow sequence of scalars, e.g. `tags: [trigger, pitfall]`.
  const flow = value.match(/^\[(.*)\]$/);
  if (flow)
    return flow[1].trim() === ''
      ? []
      : [
          ...flow[1].matchAll(
            /\s*('(?:[^']|'')*'|"(?:[^"\\]|\\.)*"|[^,]*?)\s*(?:,|$)/gy,
          ),
        ]
          .filter(([match]) => match !== '')
          .map(([, item]) => {
            if (/^[[{]/.test(item))
              throw new Error(`line ${line}: unsupported YAML value: ${value}`);
            return scalar(item, line);
          });
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
      // Types sit at the top of an entry, or under its `import` condition
      // (`{ import: { types, default }, require: { types, default } }`).
      const types =
        typeof target === 'string'
          ? target
          : (target?.types ?? target?.import?.types);
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

// -------------------------------------------------------------------- evals

/** Minimum eval cases per skill. */
export const MIN_EVAL_CASES = 3;
/** Grader types `claude plugin eval` accepts (its schema rejects the rest). */
export const GRADER_TYPES = new Set([
  'regex',
  'tool_order',
  'tool_used',
  'file_exists',
  'llm',
  'baseline',
]);
/**
 * Grader `arm` values `claude plugin eval` accepts. Under the default
 * `--ablation with-without`, `with-only` graders — including any `tool_used:
 * Skill` grader without an `arm` — are an unscored "plugin fired" indicator;
 * `both` scores the grader in both arms.
 */
export const GRADER_ARMS = new Set(['with-only', 'both']);
/** `prompt.md` frontmatter keys `claude plugin eval` reads. */
export const PROMPT_KEYS = new Set([
  'name',
  'tags',
  'runs',
  'max_turns',
  'timeout_seconds',
  'allowed_tools',
  'model',
  'append_system_prompt',
  'env',
]);
const POSITIVE_INTEGER_KEYS = ['runs', 'max_turns', 'timeout_seconds'];

/**
 * Problems with a skill's `claude plugin eval` suite: `evals/<case>/prompt.md`
 * plus `evals/<case>/graders/*.md`. `evals/results/` is run output and is
 * skipped. Each problem is `[file relative to the skill, message]`.
 */
export function evalProblems(dir, skill) {
  const problems = [];
  const report = (file, message) => problems.push([file, message]);
  const evalsDir = join(dir, 'evals');
  if (existsSync(join(evalsDir, 'evals.json')))
    report(
      'evals/evals.json',
      'skill-creator format is not read by `claude plugin eval`; use evals/<case>/prompt.md + graders/',
    );
  const cases = existsSync(evalsDir)
    ? readdirSync(evalsDir, { withFileTypes: true })
        .filter(entry => entry.isDirectory() && entry.name !== 'results')
        .map(entry => entry.name)
        .sort()
    : [];
  if (cases.length < MIN_EVAL_CASES)
    report(
      'evals',
      `needs at least ${MIN_EVAL_CASES} cases (evals/<case>/prompt.md), found ${cases.length}`,
    );

  const ownSkill = new RegExp(`(?<![\\w-])${skill}(?![\\w-])`);
  let fires = 0;
  let negatives = 0;
  for (const name of cases) {
    const caseDir = join(evalsDir, name);
    const promptFile = `evals/${name}/prompt.md`;
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name))
      report(`evals/${name}`, 'case directory is not kebab-case');
    if (!existsSync(join(caseDir, 'prompt.md'))) report(promptFile, 'missing');
    else
      try {
        const { data, body } = frontmatter(
          readFileSync(join(caseDir, 'prompt.md'), 'utf8'),
        );
        for (const key of Object.keys(data))
          if (!PROMPT_KEYS.has(key)) report(promptFile, `unknown key ${key}`);
        if (data.name !== undefined && data.name !== name)
          report(promptFile, `name '${data.name}' ≠ directory '${name}'`);
        for (const key of POSITIVE_INTEGER_KEYS)
          if (data[key] !== undefined && !/^[1-9]\d*$/.test(data[key]))
            report(promptFile, `${key} must be a positive integer`);
        for (const key of ['tags', 'allowed_tools'])
          if (data[key] !== undefined && !Array.isArray(data[key]))
            report(promptFile, `${key} must be a list`);
        if (body.trim() === '') report(promptFile, 'prompt body is empty');
      } catch (error) {
        report(promptFile, error.message);
      }

    const gradersDir = join(caseDir, 'graders');
    const graders = existsSync(gradersDir)
      ? readdirSync(gradersDir)
          .filter(file => file.endsWith('.md'))
          .sort()
      : [];
    if (graders.length === 0)
      report(`evals/${name}/graders`, 'needs at least one grader');
    for (const file of graders) {
      const graderFile = `evals/${name}/graders/${file}`;
      try {
        const { data, body } = frontmatter(
          readFileSync(join(gradersDir, file), 'utf8'),
        );
        if (!GRADER_TYPES.has(data.type)) {
          report(graderFile, `unknown grader type '${data.type}'`);
          continue;
        }
        if (data.arm !== undefined && !GRADER_ARMS.has(data.arm))
          report(
            graderFile,
            `unknown arm '${data.arm}' (use ${[...GRADER_ARMS].join(' or ')})`,
          );
        if (data.type === 'llm' && body.trim() === '')
          report(graderFile, 'llm grader has no criteria');
        if (data.type === 'regex' && typeof data.pattern !== 'string')
          report(graderFile, 'regex grader has no pattern');
        if (
          data.type === 'tool_used' &&
          data.tool === 'Skill' &&
          ownSkill.test(data.input_match ?? '')
        ) {
          if (data.max === '0') {
            negatives++;
            // Only the skill under test is loaded, so "it did not fire" is
            // the whole verdict of a negative case — and without `arm: both`
            // the ablation leaves it unscored.
            if (data.arm !== 'both')
              report(
                graderFile,
                'a negative trigger check must set `arm: both`, or `--ablation with-without` leaves it unscored',
              );
          } else fires++;
        }
      } catch (error) {
        report(graderFile, error.message);
      }
    }
  }
  if (cases.length > 0 && fires === 0)
    report(
      'evals',
      `no case asserts that ${skill} fires (a tool_used Skill grader naming it)`,
    );
  if (cases.length > 0 && negatives === 0)
    report(
      'evals',
      `no negative case (a tool_used Skill grader naming ${skill} with max: 0)`,
    );
  return problems;
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

    for (const problem of evalProblems(dir, skill)) report(...problem);

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
