/*
 * Copyright [2021-present] [ahoo wang <ahoowang@qq.com> (https://github.com/Ahoo-Wang)].
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may obtain a copy at http://www.apache.org/licenses/LICENSE-2.0
 */
import { execFileSync } from 'node:child_process';
import { appendFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

// Unknown paths run every gate. Only known isolated documentation/UI paths skip tests.
export function scopes(paths) {
  const result = {
    code: false,
    storybook: false,
    integration: false,
    generator: false,
    wiki: false,
  };
  for (const path of paths) {
    if (path.startsWith('wiki/')) result.wiki = true;
    else if (path.startsWith('stories/') || path.startsWith('.storybook/')) {
      result.storybook = true;
      result.wiki = true;
    } else if (path.startsWith('integration-test/')) result.integration = true;
    else if (
      /^(?:docs\/|skills\/).*\.md$|^\.github\/(?:ISSUE_TEMPLATE|PULL_REQUEST_TEMPLATE)\//.test(
        path,
      ) ||
      /^(README[^/]*\.md|LICENSE|NOTICE|AGENTS\.md)$/.test(path)
    )
      continue;
    else return Object.fromEntries(Object.keys(result).map(key => [key, true]));
  }
  return result;
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const { BASE_SHA, HEAD_SHA, GITHUB_OUTPUT } = process.env;
  const paths =
    BASE_SHA && HEAD_SHA
      ? execFileSync(
          'git',
          ['diff', '--no-renames', '--name-only', '-z', BASE_SHA, HEAD_SHA],
          {
            encoding: 'utf8',
          },
        )
          .split('\0')
          .filter(Boolean)
      : ['*'];
  for (const [key, value] of Object.entries(scopes(paths)))
    appendFileSync(GITHUB_OUTPUT, `${key}=${value}\n`);
}
