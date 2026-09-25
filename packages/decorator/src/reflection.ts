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

// Cache for storing previously extracted parameter names to improve performance
const parameterNameCache = new WeakMap<Function, string[]>();

/**
 * Extracts parameter names from a function.
 *
 * This function parses the string representation of a function to extract
 * the names of its parameters. It handles various function formats including
 * regular functions, arrow functions, and methods.
 *
 * Commas, parentheses and brackets inside default values, strings and comments
 * do not split parameters. A destructured parameter (`{ a, b }` or `[a, b]`)
 * has no name and yields `''`, which keeps the other names at their index; a
 * rest parameter yields its name without `...`.
 *
 * @param func - The function to extract parameter names from
 * @returns An array of parameter names, or an empty array if extraction fails
 * @throws {TypeError} If the input is not a function
 *
 * @example
 * ```typescript
 * function example(a, b, c) {}
 * const paramNames = getParameterNames(example);
 * // Returns: ['a', 'b', 'c']
 *
 * const arrowFunc = (x, y) => x + y;
 * const arrowParamNames = getParameterNames(arrowFunc);
 * // Returns: ['x', 'y']
 *
 * function complex(param1: string, param2: number = 10, ...rest: any[]) {}
 * const complexParamNames = getParameterNames(complex);
 * // Returns: ['param1', 'param2', 'rest']
 *
 * function destructured({ a, b }, c = [1, 2]) {}
 * // Returns: ['', 'c']
 * ```
 */
export function getParameterNames(func: (...args: any[]) => any): string[] {
  // Validate that the input is a function
  if (typeof func !== 'function') {
    throw new TypeError('Expected a function');
  }

  // Check cache first to improve performance
  if (parameterNameCache.has(func)) {
    return parameterNameCache.get(func)!;
  }

  try {
    // Convert function to string and trim whitespace
    const fnStr = func.toString().trim();

    // Extract parameter string from the function
    const paramsStr = extractParameterString(fnStr);

    // Handle empty parameters
    if (!hasParameters(paramsStr)) {
      const emptyResult: string[] = [];
      parameterNameCache.set(func, emptyResult);
      return emptyResult;
    }

    // Parse and clean parameter names
    const result = parseParameterNames(paramsStr);
    parameterNameCache.set(func, result);
    return result;
  } catch {
    // Return empty array on any parsing errors to avoid breaking the application
    const errorResult: string[] = [];
    parameterNameCache.set(func, errorResult);
    return errorResult;
  }
}

/**
 * Helper function to automatically extract parameter name when not provided.
 *
 * @param target - The target object (class prototype)
 * @param propertyKey - The method name
 * @param parameterIndex - The index of the parameter
 * @param providedName - The name explicitly provided by the user (if any)
 * @returns The parameter name, either provided or automatically extracted
 */
export function getParameterName(
  target: object,
  propertyKey: string | symbol,
  parameterIndex: number,
  providedName?: string,
): string | undefined {
  // If a name was explicitly provided, use it
  if (providedName) {
    return providedName;
  }

  // Try to automatically extract the parameter name
  try {
    const method = target[propertyKey as keyof typeof target];
    if (method && typeof method === 'function') {
      const paramNames = getParameterNames(method);
      // '' (a destructured parameter) has no name either.
      return paramNames[parameterIndex] || undefined;
    }
  } catch {
    // If we can't get the parameter name, return undefined
    // This will use default naming in the execution logic
  }

  return undefined;
}

function hasParameters(paramsStr: string): boolean {
  return paramsStr.trim() !== '';
}

/**
 * Walks `source` from `from`, skipping string and template literals and
 * comments, and calls `visit` for every other character with the bracket
 * depth before it. Stops when `visit` returns `true`; returns that index, or
 * -1.
 */
function scan(
  source: string,
  from: number,
  visit: (char: string, index: number, depth: number) => boolean | void,
): number {
  let depth = 0;
  for (let i = from; i < source.length; i++) {
    const char = source[i];
    if (char === '"' || char === "'" || char === '`') {
      for (i++; i < source.length && source[i] !== char; i++) {
        if (source[i] === '\\') i++;
      }
      continue;
    }
    if (char === '/' && source[i + 1] === '/') {
      const end = source.indexOf('\n', i);
      i = end < 0 ? source.length : end;
      continue;
    }
    if (char === '/' && source[i + 1] === '*') {
      const end = source.indexOf('*/', i + 2);
      i = end < 0 ? source.length : end + 1;
      continue;
    }
    if (visit(char, i, depth)) return i;
    if (char === '(' || char === '[' || char === '{') depth++;
    else if (char === ')' || char === ']' || char === '}') depth--;
  }
  return -1;
}

function extractParameterString(fnStr: string): string {
  const open = fnStr.indexOf('(');
  if (open === -1) return '';
  const close = scan(
    fnStr,
    open + 1,
    (char, _, depth) => char === ')' && depth === 0,
  );
  return close === -1 ? '' : fnStr.substring(open + 1, close);
}

function parseParameterNames(paramsStr: string): string[] {
  const parts: string[] = [];
  let start = 0;
  scan(paramsStr, 0, (char, index, depth) => {
    if (char === ',' && depth === 0) {
      parts.push(paramsStr.substring(start, index));
      start = index + 1;
    }
  });
  parts.push(paramsStr.substring(start));
  return parts
    .map(part => part.replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '').trim())
    .filter(part => part.length > 0)
    .map(extractParameterName);
}

/** The identifier a parameter binds; `''` for a destructuring pattern. */
function extractParameterName(param: string): string {
  return param.replace(/^\.\.\./, '').match(/^[A-Za-z_$][\w$]*/)?.[0] ?? '';
}
