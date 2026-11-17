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
 * regular functions, arrow functions (a lone parameter without parentheses,
 * `value => value`, included), and methods. Only the signature is read, never
 * the body.
 *
 * Commas, parentheses and brackets inside default values, strings, template
 * and regular expression literals, and comments do not split parameters.
 * Names are read whole by the ECMAScript identifier rules, so `搜索` and
 * `café` are kept as written (a `\u` escape is decoded). A destructured parameter (`{ a, b }` or `[a, b]`)
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

/** One identifier character, or a `\u` escape, as ECMAScript allows. */
const IDENTIFIER_START = String.raw`(?:[\p{ID_Start}$_]|\\u[0-9a-fA-F]{4}|\\u\{[0-9a-fA-F]+\})`;
const IDENTIFIER_PART = String.raw`(?:[\p{ID_Continue}$]|\u200C|\u200D|\\u[0-9a-fA-F]{4}|\\u\{[0-9a-fA-F]+\})`;
const IDENTIFIER = `${IDENTIFIER_START}${IDENTIFIER_PART}*`;
const LEADING_IDENTIFIER = new RegExp(`^${IDENTIFIER}`, 'u');
/** `value => …` or `async value => …`: an arrow whose lone parameter has no parentheses. */
const BARE_ARROW = new RegExp(`^(?:async\\s+)?(${IDENTIFIER})\\s*=>`, 'u');
const IDENTIFIER_CHAR = /[\p{ID_Continue}$\\]|\u200C|\u200D/u;

/** Keywords after which a `/` starts a regular expression, not a division. */
const REGEXP_AFTER_WORDS = new Set([
  'await',
  'case',
  'delete',
  'do',
  'else',
  'in',
  'instanceof',
  'new',
  'of',
  'return',
  'throw',
  'typeof',
  'void',
  'yield',
]);

/**
 * Whether the `/` at `index` starts a regular expression literal rather than
 * a division: it does unless it follows an operand (a name, number, string,
 * or a closing bracket). Enough for the expressions of default values.
 */
function startsRegExp(source: string, index: number): boolean {
  let j = index - 1;
  while (j >= 0 && /\s/.test(source[j])) j--;
  if (j < 0) return true;
  const char = source[j];
  if (char === ')' || char === ']' || char === '}') return false;
  if (char === '"' || char === "'" || char === '`') return false;
  // `a++ / 2`, `a-- / 2`: a postfix update ends an operand.
  if ((char === '+' || char === '-') && source[j - 1] === char) return false;
  if (!IDENTIFIER_CHAR.test(char)) return true;
  let start = j;
  while (start > 0 && IDENTIFIER_CHAR.test(source[start - 1])) start--;
  return REGEXP_AFTER_WORDS.has(source.substring(start, j + 1));
}

/**
 * The index of the `/` that closes the regular expression opened at `index`,
 * skipping escapes and character classes; -1 if the line ends first.
 */
function regExpEnd(source: string, index: number): number {
  let inClass = false;
  for (let i = index + 1; i < source.length; i++) {
    const char = source[i];
    if (char === '\\') i++;
    else if (char === '\n' || char === '\r') return -1;
    else if (char === '[') inClass = true;
    else if (char === ']') inClass = false;
    else if (char === '/' && !inClass) return i;
  }
  return -1;
}

/**
 * Walks `source` from `from`, skipping string, template and regular
 * expression literals and comments, and calls `visit` for every other
 * character with the bracket depth before it. Stops when `visit` returns
 * `true`; returns that index, or -1.
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
    if (char === '/' && startsRegExp(source, i)) {
      const end = regExpEnd(source, i);
      if (end !== -1) {
        // Flags that follow are plain identifier characters.
        i = end;
        continue;
      }
    }
    if (visit(char, i, depth)) return i;
    if (char === '(' || char === '[' || char === '{') depth++;
    else if (char === ')' || char === ']' || char === '}') depth--;
  }
  return -1;
}

function extractParameterString(fnStr: string): string {
  const bareArrow = BARE_ARROW.exec(fnStr);
  if (bareArrow) return bareArrow[1];
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
    .map(part => stripLeadingComments(part).trim())
    .filter(part => part.length > 0)
    .map(extractParameterName);
}

/** Removes the comments before a parameter, where its name would be. */
function stripLeadingComments(part: string): string {
  let rest = part.trimStart();
  for (;;) {
    if (rest.startsWith('//')) {
      const end = rest.indexOf('\n');
      rest = end < 0 ? '' : rest.substring(end + 1).trimStart();
    } else if (rest.startsWith('/*')) {
      const end = rest.indexOf('*/', 2);
      rest = end < 0 ? '' : rest.substring(end + 2).trimStart();
    } else {
      return rest;
    }
  }
}

/**
 * The identifier a parameter binds, Unicode and `\u` escapes included; `''`
 * for a destructuring pattern.
 */
function extractParameterName(param: string): string {
  const name =
    param.replace(/^\.\.\./, '').match(LEADING_IDENTIFIER)?.[0] ?? '';
  return name.replace(
    /\\u\{([0-9a-fA-F]+)\}|\\u([0-9a-fA-F]{4})/g,
    (_, braced: string | undefined, plain: string | undefined) =>
      String.fromCodePoint(parseInt(braced ?? plain!, 16)),
  );
}
