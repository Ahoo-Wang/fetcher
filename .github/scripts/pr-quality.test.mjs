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
