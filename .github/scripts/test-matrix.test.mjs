/*
 * Copyright [2021-present] [ahoo wang <ahoowang@qq.com> (https://github.com/Ahoo-Wang)].
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may obtain a copy at http://www.apache.org/licenses/LICENSE-2.0
 */
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { test } from 'node:test';
test('compatibility jobs execute the same tests, compiler/type steps and timeouts', () => {
  const packages = new URL('../../packages/', import.meta.url);
  for (const name of readdirSync(packages)) {
    const pkg = JSON.parse(
      readFileSync(new URL(`${name}/package.json`, packages), 'utf8'),
    );
    assert.equal(
      pkg.scripts['test:no-coverage'],
      pkg.scripts.test.replace('--coverage', '--coverage.enabled=false'),
      name,
    );
  }
});
