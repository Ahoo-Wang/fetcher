/*
 * Copyright [2021-present] [ahoo wang <ahoowang@qq.com> (https://github.com/Ahoo-Wang)].
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may obtain a copy at http://www.apache.org/licenses/LICENSE-2.0
 */

/** Where 5.1.3 and earlier published the UMD bundle of these packages. */
export const LEGACY_UMD = 'index.umd.js';
/** The UMD bundle `exports.require` and `main` point at. */
export const UMD = 'index.umd.cjs';

/**
 * 5.x keeps every published URL working in a patch release: the UMD bundle
 * is `dist/index.umd.cjs` (CommonJS inside a `"type": "module"` package, the
 * `require` target), and this plugin writes the same bundle to the old
 * `dist/index.umd.js` too, for CDN users who load that path by URL. Nothing
 * in `exports` or `main` references the `.js` copy. 6.0 drops it.
 *
 * @returns {import('vite').Plugin}
 */
export function legacyUmdPath() {
  return {
    name: 'fetcher:legacy-umd-path',
    generateBundle(options, bundle) {
      if (options.format !== 'umd') return;
      const chunk = bundle[UMD];
      if (chunk?.type !== 'chunk')
        this.error(`expected the UMD bundle at ${UMD}`);
      this.emitFile({
        type: 'asset',
        fileName: LEGACY_UMD,
        source: chunk.code,
      });
    },
  };
}
