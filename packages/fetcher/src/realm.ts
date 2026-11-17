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

/**
 * Type checks that hold for objects from another realm (a same-origin iframe,
 * a Node `vm` context) as well as this one.
 *
 * `instanceof` compares against this realm's constructor, so a `Date` or
 * `Blob` made in an iframe fails it. Each check here falls back to the
 * built-in's own brand check: a prototype getter or method of this realm's
 * constructor, which reads the object's internal slots and throws for
 * anything that does not have them, whatever realm made it. A plain object
 * that only claims the type (through `Symbol.toStringTag`, say) fails.
 *
 * @internal
 */

type BrandProbe = (value: object) => unknown;

function getterProbe(typeName: string, property: string): BrandProbe | null {
  const type = (globalThis as Record<string, unknown>)[typeName];
  if (typeof type !== 'function') return null;
  const getter = Object.getOwnPropertyDescriptor(
    (type as { prototype: object }).prototype,
    property,
  )?.get;
  return getter ? value => getter.call(value) : null;
}

function methodProbe(
  typeName: string,
  method: string,
  ...args: unknown[]
): BrandProbe | null {
  const type = (globalThis as Record<string, unknown>)[typeName];
  if (typeof type !== 'function') return null;
  const fn = (type as { prototype: Record<string, unknown> }).prototype[method];
  return typeof fn === 'function' ? value => fn.apply(value, args) : null;
}

function hasBrand(
  value: unknown,
  typeName: string,
  probe: () => BrandProbe | null,
): boolean {
  if (value === null || typeof value !== 'object') return false;
  const type = (globalThis as Record<string, unknown>)[typeName];
  if (typeof type !== 'function') return false;
  try {
    if (value instanceof (type as abstract new (...args: never[]) => unknown)) {
      return true;
    }
  } catch {
    // A constructor with a throwing Symbol.hasInstance; try the brand check.
  }
  const check = probe();
  if (!check) return false;
  try {
    check(value);
    return true;
  } catch {
    return false;
  }
}

/** Whether `value` is a `Date`, from any realm. */
export function isDate(value: unknown): value is Date {
  return hasBrand(value, 'Date', () => methodProbe('Date', 'getTime'));
}

/** Whether `value` is a `Map`, from any realm. */
export function isMap(value: unknown): value is Map<unknown, unknown> {
  return hasBrand(value, 'Map', () => getterProbe('Map', 'size'));
}

/** Whether `value` is an `ArrayBuffer`, from any realm. */
export function isArrayBuffer(value: unknown): value is ArrayBuffer {
  return hasBrand(value, 'ArrayBuffer', () =>
    getterProbe('ArrayBuffer', 'byteLength'),
  );
}

/** Whether `value` is a `Blob` (a `File` included), from any realm. */
export function isBlob(value: unknown): value is Blob {
  return hasBrand(value, 'Blob', () => getterProbe('Blob', 'size'));
}

/** Whether `value` is a `FormData`, from any realm. */
export function isFormData(value: unknown): value is FormData {
  return hasBrand(value, 'FormData', () => methodProbe('FormData', 'has', ''));
}

/** Whether `value` is a `URLSearchParams`, from any realm. */
export function isURLSearchParams(value: unknown): value is URLSearchParams {
  return hasBrand(value, 'URLSearchParams', () =>
    methodProbe('URLSearchParams', 'has', ''),
  );
}

/** Whether `value` is a `ReadableStream`, from any realm. */
export function isReadableStream(value: unknown): value is ReadableStream {
  return hasBrand(value, 'ReadableStream', () =>
    getterProbe('ReadableStream', 'locked'),
  );
}
