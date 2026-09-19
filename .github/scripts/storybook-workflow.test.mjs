/*
 * Copyright [2021-present] [ahoo wang <ahoowang@qq.com> (https://github.com/Ahoo-Wang)].
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may obtain a copy at http://www.apache.org/licenses/LICENSE-2.0
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const workflow = readFileSync(
  new URL('../workflows/build-storybook.yml', import.meta.url),
  'utf8',
);

test('the delivery job builds Storybook once and verifies its static index', () => {
  const [delivery] = workflow.split('\n  interactions:\n');
  assert.match(delivery, /run: pnpm build-storybook/);
  assert.equal(delivery.match(/build-storybook/g).length, 1);
  const script = JSON.parse(
    readFileSync(new URL('../../package.json', import.meta.url), 'utf8'),
  ).scripts['build-storybook'];
  assert.match(
    script,
    /storybook build --docs && node scripts\/verify-storybook\.mjs/,
  );
});

test('the delivery job type-checks the stories against the packages it built', () => {
  const [delivery] = workflow.split('\n  interactions:\n');
  const build = delivery.indexOf("run: pnpm -r --filter './packages/*' build");
  const typecheck = delivery.indexOf('run: pnpm typecheck:stories');
  assert.ok(build >= 0, 'The delivery job builds the packages');
  assert.ok(typecheck > build, 'Stories are checked after the build');
  const script = JSON.parse(
    readFileSync(new URL('../../package.json', import.meta.url), 'utf8'),
  ).scripts['typecheck:stories'];
  assert.equal(script, 'tsc -p stories/tsconfig.json');
});

test('interaction tests and delivery run on separate jobs without dropping either gate', () => {
  const [delivery, interactions] = workflow.split('\n  interactions:\n');
  assert.ok(interactions, 'Interactions need their own runner');
  assert.doesNotMatch(delivery, /run: pnpm test:storybook/);
  assert.match(interactions, /run: pnpm test:storybook/);
  assert.match(interactions, /needs: changes/);
  assert.doesNotMatch(interactions, /build-storybook/);
});
