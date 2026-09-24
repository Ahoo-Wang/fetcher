/*
 * Copyright [2021-present] [ahoo wang <ahoowang@qq.com> (https://github.com/Ahoo-Wang)].
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may obtain a copy at http://www.apache.org/licenses/LICENSE-2.0
 */
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  rmSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { test } from 'node:test';

test('versioning and publishing cover every scoped workspace package', () => {
  const dir = mkdtempSync(join(tmpdir(), 'fetcher-release-'));
  const paths = ['', 'integration-test', 'packages/fetcher', 'packages/react'];
  try {
    for (const path of paths) {
      mkdirSync(join(dir, path), { recursive: true });
      writeFileSync(
        join(dir, path, 'package.json'),
        JSON.stringify({
          name: path.startsWith('packages/')
            ? `@ahoo-wang/${path.endsWith('react') ? 'fetcher-react' : 'fetcher'}`
            : 'workspace',
          version: '5.0.0',
        }),
      );
    }
    execFileSync('bash', [resolve('scripts/update-all-versions.sh'), '5.1.0'], {
      cwd: dir,
    });
    for (const path of paths) {
      assert.equal(
        JSON.parse(readFileSync(join(dir, path, 'package.json'))).version,
        '5.1.0',
      );
    }
    mkdirSync(join(dir, 'bin'));
    writeFileSync(
      join(dir, 'bin/pnpm'),
      '#!/bin/sh\nprintf "%s\\n" "$*" >> "$PUBLISH_LOG"\n',
      { mode: 0o755 },
    );
    const log = join(dir, 'published');
    execFileSync('bash', [resolve('scripts/publish-npm.sh')], {
      cwd: dir,
      env: {
        ...process.env,
        PATH: `${join(dir, 'bin')}:${process.env.PATH}`,
        PUBLISH_LOG: log,
      },
    });
    assert.equal(
      readFileSync(log, 'utf8'),
      'publish packages/fetcher/ --access public --no-git-checks\n' +
        'publish packages/react/ --access public --no-git-checks\n',
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
