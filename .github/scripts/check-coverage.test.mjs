/*
 * Copyright [2021-present] [ahoo wang <ahoowang@qq.com> (https://github.com/Ahoo-Wang)].
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may obtain a copy at http://www.apache.org/licenses/LICENSE-2.0
 */
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
test('combined coverage requires valid reports from every package', () => {
  const root = mkdtempSync(join(tmpdir(), 'ci-coverage-'));
  const check = () =>
    execFileSync(
      process.execPath,
      [fileURLToPath(new URL('./check-coverage.mjs', import.meta.url))],
      { cwd: root, stdio: 'pipe' },
    );
  try {
    for (const name of ['a', 'b']) {
      mkdirSync(join(root, 'packages', name), { recursive: true });
      mkdirSync(
        join(root, 'coverage-artifacts', 'packages', name, 'coverage'),
        { recursive: true },
      );
    }
    const report = name =>
      join(
        root,
        'coverage-artifacts',
        'packages',
        name,
        'coverage',
        'coverage-final.json',
      );
    writeFileSync(report('a'), '{}');
    assert.throws(check);
    writeFileSync(report('b'), '{}');
    assert.doesNotThrow(check);
    writeFileSync(report('b'), 'invalid');
    assert.throws(check);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
