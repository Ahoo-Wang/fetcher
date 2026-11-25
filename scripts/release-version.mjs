/*
 * Copyright [2021-present] [ahoo wang <ahoowang@qq.com> (https://github.com/Ahoo-Wang)].
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may obtain a copy at http://www.apache.org/licenses/LICENSE-2.0
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

/**
 * Release versions and npm dist-tags, checked before anything is published.
 *
 * A release version is `MAJOR.MINOR.PATCH` or `MAJOR.MINOR.PATCH-<word>.<n>`
 * with a lowercase word: `8.0.0-rc.1`, `8.0.0-beta.9`. semver orders
 * prerelease identifiers by ASCII, so `8.0.0-RC1` sorts below `8.0.0-beta.9`,
 * and `rc10` below `rc2`; both forms are refused.
 *
 * The dist-tag follows from the version, never from a default:
 *
 * - a prerelease goes to its word (`8.0.0-rc.1` → `rc`), never `latest`;
 * - a stable version goes to `latest`, unless npm's `latest` for that package
 *   is already higher (a 6.x patch published after 8.0.0): then it goes to
 *   `latest-<major>` (`latest-6`), so a maintenance release cannot take
 *   `latest` back. (`6.x` and `v6` cannot be tags: npm rejects tags that are
 *   valid semver ranges.)
 *
 * `NPM_DIST_TAG` overrides the choice; it still may not put a prerelease on
 * `latest`.
 */
export const VERSION =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([a-z]+)\.(0|[1-9]\d*))?$/;
const TAG = /^[a-z][a-z0-9-]*$/;
const RANGE_LIKE = /^v?\d/;

/** The parts of a release version, or an error naming what is wrong. */
export function parseVersion(version) {
  const match = VERSION.exec(version ?? '');
  if (!match)
    throw new Error(
      `Release version "${version}" must be MAJOR.MINOR.PATCH or ` +
        'MAJOR.MINOR.PATCH-<lowercase word>.<number> (for example 8.0.0-rc.1): ' +
        'semver compares prerelease identifiers by ASCII, so an uppercase or ' +
        'undotted suffix (8.0.0-RC1, 8.0.0-rc1) sorts wrongly.',
    );
  const [, major, minor, patch, word, number] = match;
  return {
    major: Number(major),
    minor: Number(minor),
    patch: Number(patch),
    prerelease: word ? [word, Number(number)] : [],
  };
}

/** Any semver version, for comparing with what npm already has. */
function looseParts(version) {
  const match = /^v?(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?(?:\+.*)?$/.exec(
    version,
  );
  if (!match) throw new Error(`npm reported an invalid version "${version}"`);
  return {
    core: [Number(match[1]), Number(match[2]), Number(match[3])],
    prerelease: match[4]
      ? match[4].split('.').map(id => (/^\d+$/.test(id) ? Number(id) : id))
      : [],
  };
}

/** semver precedence: negative when a < b, 0 when equal, positive when a > b. */
export function compareVersions(a, b) {
  const x = looseParts(a);
  const y = looseParts(b);
  for (let i = 0; i < 3; i++)
    if (x.core[i] !== y.core[i]) return x.core[i] - y.core[i];
  if (!x.prerelease.length || !y.prerelease.length)
    return y.prerelease.length - x.prerelease.length;
  for (let i = 0; i < Math.max(x.prerelease.length, y.prerelease.length); i++) {
    const p = x.prerelease[i];
    const q = y.prerelease[i];
    if (p === undefined) return -1;
    if (q === undefined) return 1;
    if (p === q) continue;
    if (typeof p === 'number' && typeof q === 'number') return p - q;
    if (typeof p === 'number') return -1;
    if (typeof q === 'number') return 1;
    return p < q ? -1 : 1;
  }
  return 0;
}

/**
 * The dist-tag for publishing `version` when npm's `latest` for the package
 * is `latest` (null when the package is not on npm yet).
 */
export function distTag(version, latest, override) {
  const { major, prerelease } = parseVersion(version);
  if (override) {
    if (!TAG.test(override) || RANGE_LIKE.test(override))
      throw new Error(
        `NPM_DIST_TAG "${override}" must be lowercase letters, digits and ` +
          'dashes, starting with a letter (npm rejects tags that look like versions)',
      );
    if (prerelease.length && override === 'latest')
      throw new Error(`Prerelease ${version} must not be published as latest`);
    return override;
  }
  if (prerelease.length) return prerelease[0];
  if (latest && compareVersions(version, latest) < 0) return `latest-${major}`;
  return 'latest';
}

/** `package.json` paths that `pnpm update-version` versions. */
export function versionedManifests(root) {
  const manifests = ['package.json'];
  const packages = join(root, 'packages');
  if (existsSync(packages))
    for (const entry of readdirSync(packages, { withFileTypes: true }).sort(
      (a, b) => a.name.localeCompare(b.name),
    ))
      if (
        entry.isDirectory() &&
        existsSync(join(packages, entry.name, 'package.json'))
      )
        manifests.push(join('packages', entry.name, 'package.json'));
  if (existsSync(join(root, 'integration-test', 'package.json')))
    manifests.push(join('integration-test', 'package.json'));
  return manifests;
}

/**
 * The single release version of the workspace at `root`. Throws when the
 * manifests disagree, the version is malformed, or it does not match the
 * GitHub release that triggered publishing (`releaseTag`, `prerelease`).
 */
export function releaseVersion(root, { releaseTag, prerelease } = {}) {
  const versions = new Map();
  for (const manifest of versionedManifests(root))
    versions.set(
      manifest,
      JSON.parse(readFileSync(join(root, manifest), 'utf8')).version,
    );
  const distinct = new Set(versions.values());
  if (distinct.size !== 1)
    throw new Error(
      'Every package must carry the same version (run pnpm update-version <version>):\n' +
        [...versions].map(([path, v]) => `  ${path}: ${v}`).join('\n'),
    );
  const [version] = distinct;
  const parsed = parseVersion(version);
  if (releaseTag && releaseTag !== `v${version}`)
    throw new Error(
      `Release tag ${releaseTag} does not match the package version ${version} (expected v${version})`,
    );
  if (prerelease === 'true' || prerelease === 'false') {
    const isPrerelease = parsed.prerelease.length > 0;
    if (String(isPrerelease) !== prerelease)
      throw new Error(
        isPrerelease
          ? `${version} is a prerelease: mark the GitHub release as a pre-release`
          : `${version} is not a prerelease: do not mark the GitHub release as a pre-release`,
      );
  }
  return version;
}

/** npm's `latest` version of `name`, or null when npm has no such package. */
export function registryLatest(name) {
  try {
    const out = execFileSync('npm', ['view', name, 'dist-tags.latest'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim();
    return out || null;
  } catch (error) {
    if (/E404/.test(String(error.stderr))) return null;
    throw error;
  }
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const [command, name] = process.argv.slice(2);
  try {
    const version = releaseVersion(process.cwd(), {
      releaseTag: process.env.RELEASE_TAG,
      prerelease: process.env.RELEASE_PRERELEASE,
    });
    if (command === 'check') console.log(version);
    else if (command === 'tag' && name) {
      const { prerelease } = parseVersion(version);
      const latest =
        prerelease.length || process.env.NPM_DIST_TAG
          ? null
          : registryLatest(name);
      console.log(distTag(version, latest, process.env.NPM_DIST_TAG));
    } else {
      console.error('Usage: release-version.mjs check | tag <package-name>');
      process.exit(2);
    }
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}
