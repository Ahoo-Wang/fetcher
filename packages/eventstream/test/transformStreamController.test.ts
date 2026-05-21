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
  it('should call controller.terminate() on first call', () => {
    const controller = { terminate: vi.fn() };
    safeTerminate(controller as any);
    expect(controller.terminate).toHaveBeenCalledTimes(1);
  });

  it('should not throw when controller.terminate() throws TypeError', () => {
    const controller = {
      terminate: vi.fn(() => {
        throw new TypeError('the stream has been terminated');
      }),
    };
    expect(() => safeTerminate(controller as any)).not.toThrow();
    expect(controller.terminate).toHaveBeenCalledTimes(1);
  });

  it('should re-throw non-TypeError errors from controller.terminate()', () => {
    const controller = {
      terminate: vi.fn(() => {
        throw new RangeError('unexpected error');
      }),
    };
    expect(() => safeTerminate(controller as any)).toThrow(RangeError);
  });
});

describe('safeEnqueue', () => {
  it('should enqueue chunk to controller', () => {
    const controller = { enqueue: vi.fn() };
    safeEnqueue(controller as any, 'test-chunk');
    expect(controller.enqueue).toHaveBeenCalledWith('test-chunk');
  });

  it('should not throw when controller.enqueue() throws TypeError', () => {
    const controller = {
      enqueue: vi.fn(() => {
        throw new TypeError('Cannot enqueue a chunk into a closed stream');
      }),
    };
    expect(() => safeEnqueue(controller as any, 'chunk')).not.toThrow();
    expect(controller.enqueue).toHaveBeenCalledTimes(1);
  });

  it('should re-throw non-TypeError errors from controller.enqueue()', () => {
    const controller = {
      enqueue: vi.fn(() => {
        throw new RangeError('unexpected error');
      }),
    };
    expect(() => safeEnqueue(controller as any, 'chunk')).toThrow(RangeError);
  });
});

describe('safeError', () => {
  it('should call controller.error() with the reason', () => {
    const controller = { error: vi.fn() };
    const reason = new Error('test error');
    safeError(controller as any, reason);
    expect(controller.error).toHaveBeenCalledWith(reason);
  });

  it('should not throw when controller.error() throws TypeError', () => {
    const controller = {
      error: vi.fn(() => {
        throw new TypeError('Cannot error an already-errored stream');
      }),
    };
    expect(() => safeError(controller as any, new Error('x'))).not.toThrow();
    expect(controller.error).toHaveBeenCalledTimes(1);
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
});
