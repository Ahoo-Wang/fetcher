/*
 * Copyright [2021-present] [ahoo wang <ahoowang@qq.com> (https://github.com/Ahoo-Wang)].
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may obtain a copy at http://www.apache.org/licenses/LICENSE-2.0
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { validate } from './pr-quality.mjs';
test('validates metadata as data, including dependency updates and breaking changes', () => {
  for (const title of [
    'ci: reduce repeated tests',
    'chore(deps): update packages',
    'feat(api)!: replace contract',
  ])
    assert.doesNotThrow(() => validate(title, 'Reason and validation'));
  assert.throws(() => validate('update', 'reason'));
  assert.throws(() => validate('fix: correct query', '  '));
});

test('accepts the title shape rendered from the repository renovate config', async () => {
  const { readFileSync } = await import('node:fs');
  const { commitMessagePrefix } = JSON.parse(
    readFileSync(new URL('../../renovate.json', import.meta.url), 'utf8'),
  );
  const title = `${commitMessagePrefix} Update yaml to ^2.9.1`;
  assert.doesNotThrow(() => validate(title, 'Reason and validation'));
});

test('rejects an unchanged PR template but accepts filled-in content', async () => {
  const { readFileSync } = await import('node:fs');
  const template = readFileSync(
    new URL(
      '../PULL_REQUEST_TEMPLATE/pull_request_template.md',
      import.meta.url,
    ),
    'utf8',
  );
  assert.throws(() => validate('ci: improve checks', template));
  assert.doesNotThrow(() =>
    validate(
      'ci: improve checks',
      template + '\nReuse existing coverage; verified unit tests.',
    ),
  );
});
