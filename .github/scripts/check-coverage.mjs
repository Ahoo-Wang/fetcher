/*
 * Copyright [2021-present] [ahoo wang <ahoowang@qq.com> (https://github.com/Ahoo-Wang)].
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may obtain a copy at http://www.apache.org/licenses/LICENSE-2.0
 */
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
for (const name of readdirSync('packages')) {
  const file = `coverage-artifacts/packages/${name}/coverage/coverage-final.json`;
  const report = JSON.parse(readFileSync(file, 'utf8'));
  assert.ok(
    report && typeof report === 'object' && !Array.isArray(report),
    file,
  );
}
