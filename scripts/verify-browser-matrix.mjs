/*
 * Copyright [2021-present] [ahoo wang <ahoowang@qq.com> (https://github.com/Ahoo-Wang)].
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may obtain a copy at http://www.apache.org/licenses/LICENSE-2.0
 */
export async function verifyBrowserMatrix(browsers, verify) {
  const failures = [];
  for (const browser of browsers) {
    try {
      await verify(browser);
    } catch (error) {
      if (error?.name === 'AbortError') throw error;
      failures.push(
        new Error(`${browser}: ${error?.message ?? error}`, { cause: error }),
      );
    }
  }
  if (failures.length)
    throw new AggregateError(failures, 'Browser delivery checks failed');
}
