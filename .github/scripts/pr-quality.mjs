/*
 * Copyright [2021-present] [ahoo wang <ahoowang@qq.com> (https://github.com/Ahoo-Wang)].
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may obtain a copy at http://www.apache.org/licenses/LICENSE-2.0
 */
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';

export function validate(title, body) {
  assert.match(
    title,
    /^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(\([^\r\n)]+\))?!?: \S.+$/,
    'PR title must use Conventional Commits',
  );
  assert.ok(
    body
      ?.replace(/<!--[\s\S]*?-->/g, '')
      .replace(/^\s*#{1,6}\s+.*$/gm, '')
      .trim(),
    'PR description must explain the change and validation',
  );
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href &&
  process.env.GITHUB_EVENT_NAME === 'pull_request'
)
  validate(process.env.PR_TITLE, process.env.PR_BODY);
