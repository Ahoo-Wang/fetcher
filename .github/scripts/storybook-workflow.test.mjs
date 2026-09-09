/*
 * Copyright [2021-present] [ahoo wang <ahoowang@qq.com> (https://github.com/Ahoo-Wang)].
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may obtain a copy at http://www.apache.org/licenses/LICENSE-2.0
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

test('Storybook production build is owned by the delivery verifier, not duplicated by CI', () => {
  const workflow = readFileSync(
    new URL('../workflows/build-storybook.yml', import.meta.url),
    'utf8',
  );
  assert.match(workflow, /run: pnpm verify:view-engine/);
  assert.doesNotMatch(workflow, /run:.*build-storybook/);
  const verifier = readFileSync(
    new URL('../../scripts/verify-view-engine.mjs', import.meta.url),
    'utf8',
  );
  assert.match(
    verifier,
    /await run\('storybook-build', pnpm, \['build-storybook'\]\)/,
  );
});
