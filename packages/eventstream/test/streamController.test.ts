/*
 * Copyright [2021-present] [ahoo wang <ahoowang@qq.com> (https://github.com/Ahoo-Wang)].
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *      http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { describe, expect, it, vi } from 'vitest';
import { runInNewContext } from 'node:vm';
import { safeTerminate, safeEnqueue, safeError } from '../src';

describe('safeTerminate', () => {
  it('should return true on successful termination', () => {
    const controller = { terminate: vi.fn() };
    expect(safeTerminate(controller as any)).toBe(true);
  });

  it('should return false when controller.terminate() throws TypeError', () => {
    const controller = {
      terminate: vi.fn(() => {
        throw new TypeError('the stream has been terminated');
      }),
    };
    expect(safeTerminate(controller as any)).toBe(false);
  });

  it('should re-throw non-TypeError errors from controller.terminate()', () => {
    const controller = {
      terminate: vi.fn(() => {
        throw new RangeError('unexpected error');
      }),
    };
    expect(() => safeTerminate(controller as any)).toThrow(RangeError);
  });

  it('should return false for real cross-realm TypeError', () => {
    const crossRealmLike = runInNewContext('new TypeError("stream closed")');
    const controller = {
      terminate: vi.fn(() => {
        throw crossRealmLike;
      }),
    };
    expect(safeTerminate(controller as any)).toBe(false);
  });

  it('should re-throw plain objects with name TypeError but wrong toStringTag', () => {
    const fakeError = { name: 'TypeError', message: 'stream closed' };
    const controller = {
      terminate: vi.fn(() => {
        throw fakeError;
      }),
    };
    let caught: any;
    try {
      safeTerminate(controller as any);
    } catch (e) {
      caught = e;
    }
    expect(caught).toBe(fakeError);
  });
});

describe('safeEnqueue', () => {
  it('should return true on successful enqueue', () => {
    const controller = { enqueue: vi.fn() };
    expect(safeEnqueue(controller as any, 'test-chunk')).toBe(true);
    expect(controller.enqueue).toHaveBeenCalledWith('test-chunk');
  });

  it('should return false when controller.enqueue() throws TypeError', () => {
    const controller = {
      enqueue: vi.fn(() => {
        throw new TypeError('Cannot enqueue a chunk into a closed stream');
      }),
    };
    expect(safeEnqueue(controller as any, 'chunk')).toBe(false);
  });

  it('should re-throw non-TypeError errors from controller.enqueue()', () => {
    const controller = {
      enqueue: vi.fn(() => {
        throw new RangeError('unexpected error');
      }),
    };
    expect(() => safeEnqueue(controller as any, 'chunk')).toThrow(RangeError);
  });

  it('should return false for real cross-realm TypeError', () => {
    const crossRealmLike = runInNewContext('new TypeError("stream closed")');
    const controller = {
      enqueue: vi.fn(() => {
        throw crossRealmLike;
      }),
    };
    expect(safeEnqueue(controller as any, 'chunk')).toBe(false);
  });

  it('should re-throw plain objects with name TypeError but wrong toStringTag', () => {
    const fakeError = { name: 'TypeError', message: 'stream closed' };
    const controller = {
      enqueue: vi.fn(() => {
        throw fakeError;
      }),
    };
    let caught: any;
    try {
      safeEnqueue(controller as any, 'chunk');
    } catch (e) {
      caught = e;
    }
    expect(caught).toBe(fakeError);
  });
});

describe('safeError', () => {
  it('should return true on successful error', () => {
    const controller = { error: vi.fn() };
    const reason = new Error('test error');
    expect(safeError(controller as any, reason)).toBe(true);
    expect(controller.error).toHaveBeenCalledWith(reason);
  });

  it('should return false when controller.error() throws TypeError', () => {
    const controller = {
      error: vi.fn(() => {
        throw new TypeError('Cannot error an already-errored stream');
      }),
    };
    expect(safeError(controller as any, new Error('x'))).toBe(false);
  });

  it('should re-throw non-TypeError errors from controller.error()', () => {
    const controller = {
      error: vi.fn(() => {
        throw new RangeError('unexpected error');
      }),
    };
    expect(() => safeError(controller as any, new Error('x'))).toThrow(
      RangeError,
    );
  });

  it('should return false for real cross-realm TypeError', () => {
    const crossRealmLike = runInNewContext('new TypeError("stream closed")');
    const controller = {
      error: vi.fn(() => {
        throw crossRealmLike;
      }),
    };
    expect(safeError(controller as any, new Error('x'))).toBe(false);
  });

  it('should re-throw plain objects with name TypeError but wrong toStringTag', () => {
    const fakeError = { name: 'TypeError', message: 'stream closed' };
    const controller = {
      error: vi.fn(() => {
        throw fakeError;
      }),
    };
    let caught: any;
    try {
      safeError(controller as any, new Error('x'));
    } catch (e) {
      caught = e;
    }
    expect(caught).toBe(fakeError);
  });
});

it.each([
  { name: 'TypeError', [Symbol.toStringTag]: 'TypeError' },
  { name: 'TypeError', [Symbol.toStringTag]: 'Error' },
  Object.create(TypeError.prototype),
  Object.assign(new Error('other'), { name: 'TypeError' }),
  runInNewContext('new RangeError("other")'),
  runInNewContext(
    'class Other extends Error {}; Other.prototype.name = "TypeError"; new Other("other")',
  ),
])('does not swallow a forged or unrelated TypeError-like value: %j', value => {
  let caught: unknown;
  try {
    safeEnqueue(
      {
        enqueue() {
          throw value;
        },
      } as any,
      1,
    );
  } catch (error) {
    caught = error;
  }
  expect(caught).toBe(value);
});

it('recognizes a real cross-realm TypeError subclass', () => {
  const error = runInNewContext(
    'class Closed extends TypeError {}; new Closed("closed")',
  );
  expect(
    safeEnqueue(
      {
        enqueue() {
          throw error;
        },
      } as any,
      1,
    ),
  ).toBe(false);
});
