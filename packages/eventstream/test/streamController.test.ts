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

  it('should return false for cross-realm TypeError (instanceof fails, toString matches)', () => {
    // Construct an object that instanceof TypeError returns false for,
    // but Object.prototype.toString returns '[object TypeError]'
    // This simulates a TypeError from another realm
    const crossRealmLike = { [Symbol.toStringTag]: 'TypeError', message: 'stream closed' };
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
    expect(() => safeTerminate(controller as any)).toThrow(fakeError);
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

  it('should return false for cross-realm TypeError (instanceof fails, toString matches)', () => {
    const crossRealmLike = { [Symbol.toStringTag]: 'TypeError', message: 'stream closed' };
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
    expect(() => safeEnqueue(controller as any, 'chunk')).toThrow(fakeError);
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

  it('should return false for cross-realm TypeError (instanceof fails, toString matches)', () => {
    const crossRealmLike = { [Symbol.toStringTag]: 'TypeError', message: 'stream closed' };
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
    expect(() => safeError(controller as any, new Error('x'))).toThrow(fakeError);
  });
});
