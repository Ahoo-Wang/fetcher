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

import { StrictMode, useEffect, useLayoutEffect, type ReactNode } from 'react';
import { act, render, renderHook } from '@testing-library/react';
import { SerialTypedEventBus } from '@ahoo-wang/fetcher-eventbus';
import { useEventSubscription } from '../../src';

const buses: SerialTypedEventBus<string>[] = [];
function createBus(type: string) {
  const bus = new SerialTypedEventBus<string>(type);
  buses.push(bus);
  return bus;
}
afterEach(() => {
  for (const bus of buses.splice(0)) bus.destroy();
});

describe('an old subscriber never removes a newer owner of its name (#1993)', () => {
  it('after its once subscription ran', async () => {
    const bus = createBus('once');
    const first = vi.fn();
    const second = vi.fn();
    const old = renderHook(() =>
      useEventSubscription({
        bus,
        handler: { name: 'same', once: true, handle: first },
      }),
    );
    await act(async () => {
      await bus.emit('first');
    });
    expect(first).toHaveBeenCalledWith('first');
    expect(bus.handlers).toHaveLength(0);

    renderHook(() =>
      useEventSubscription({ bus, handler: { name: 'same', handle: second } }),
    );
    expect(bus.handlers).toHaveLength(1);
    old.unmount();
    await act(async () => {
      await bus.emit('second');
    });
    expect(second).toHaveBeenCalledWith('second');
  });

  it('after it was unsubscribed by hand', async () => {
    const bus = createBus('manual');
    const second = vi.fn();
    const old = renderHook(() =>
      useEventSubscription({ bus, handler: { name: 'same', handle: vi.fn() } }),
    );
    expect(old.result.current.unsubscribe()).toBe(true);
    renderHook(() =>
      useEventSubscription({ bus, handler: { name: 'same', handle: second } }),
    );
    old.unmount();
    await bus.emit('event');
    expect(second).toHaveBeenCalledWith('event');
  });

  it.each(['bus', 'order', 'once'] as const)(
    'when a change of %s cleans up the old subscription',
    async change => {
      const bus = createBus('deps');
      const other = createBus('other');
      const second = vi.fn();
      const old = renderHook(
        ({ order, once, target }) =>
          useEventSubscription({
            bus: target,
            handler: { name: 'same', order, once, handle: vi.fn() },
          }),
        { initialProps: { order: 0, once: false, target: bus } },
      );
      old.result.current.unsubscribe();
      renderHook(() =>
        useEventSubscription({
          bus,
          handler: { name: 'same', handle: second },
        }),
      );
      old.rerender({
        order: change === 'order' ? 1 : 0,
        once: change === 'once',
        target: change === 'bus' ? other : bus,
      });
      await bus.emit('event');
      expect(second).toHaveBeenCalledWith('event');
    },
  );

  it('unsubscribe() of a hook that did not get the name', async () => {
    const bus = createBus('loser');
    const owner = vi.fn();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    renderHook(() =>
      useEventSubscription({ bus, handler: { name: 'same', handle: owner } }),
    );
    const loser = renderHook(() =>
      useEventSubscription({ bus, handler: { name: 'same', handle: vi.fn() } }),
    );
    expect(loser.result.current.unsubscribe()).toBe(false);
    loser.unmount();
    await bus.emit('event');
    expect(owner).toHaveBeenCalledWith('event');
  });
});

describe('a manual subscribe() is cleaned up on unmount (#2048)', () => {
  it.each([
    ['plain', ({ children }: { children: ReactNode }) => <>{children}</>],
    ['StrictMode', StrictMode],
  ] as const)('%s: subscribe() from a layout effect', async (_, wrapper) => {
    const bus = createBus('layout');
    const received: string[] = [];
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    function Probe() {
      const { subscribe } = useEventSubscription({
        bus,
        handler: { name: 'owned', handle: event => void received.push(event) },
      });
      useLayoutEffect(() => {
        subscribe();
      }, [subscribe]);
      return null;
    }
    const view = render(<Probe />, { wrapper });
    expect(bus.handlers).toHaveLength(1);
    await bus.emit('mounted');
    view.unmount();
    await bus.emit('unmounted');
    expect(received).toEqual(['mounted']);
    expect(bus.handlers).toHaveLength(0);
    expect(warn).not.toHaveBeenCalled();
  });

  it('subscribe() once another owner let the name go', async () => {
    const bus = createBus('late');
    const received = vi.fn();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const owner = renderHook(() =>
      useEventSubscription({ bus, handler: { name: 'n', handle: vi.fn() } }),
    );
    const late = renderHook(() =>
      useEventSubscription({ bus, handler: { name: 'n', handle: received } }),
    );
    owner.unmount();
    expect(late.result.current.subscribe()).toBe(true);
    late.unmount();
    expect(bus.handlers).toHaveLength(0);
  });

  it('passive-effect control: a later subscribe() returns false', () => {
    const bus = createBus('passive');
    let manual: boolean | undefined;
    function Probe() {
      const { subscribe } = useEventSubscription({
        bus,
        handler: { name: 'owned', handle: vi.fn() },
      });
      useEffect(() => {
        manual = subscribe();
      }, [subscribe]);
      return null;
    }
    const view = render(<Probe />);
    expect(manual).toBe(false);
    view.unmount();
    expect(bus.handlers).toHaveLength(0);
  });
});
