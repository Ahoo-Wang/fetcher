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
 * Extracts parameter names from a function
 *
 * This function parses the string representation of a function to extract
 * the names of its parameters. It handles various function formats including
 * regular functions, arrow functions, and methods.
 *
 * Note: This implementation provides basic parameter name extraction and may not
 * handle all edge cases of complex TypeScript parameter declarations.
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
 * // Returns: ['param1', 'param2', '...rest']
 * ```
 */
export function getParameterNames(func: (...args: any[]) => any): string[] {
  // Validate that the input is a function
  if (typeof func !== 'function') {
    throw new TypeError('Expected a function');
  }

  try {
    // Convert function to string and trim whitespace
    const fnStr = func.toString().trim();

    // Extract parameter string from the function
    const paramsStr = extractParameterString(fnStr);

    // Handle empty parameters
    if (!hasParameters(paramsStr)) {
      return [];
    }

    // Parse and clean parameter names
    return parseParameterNames(paramsStr);
  } catch (_error: unknown) {
    // Return empty array on any parsing errors to avoid breaking the application
    return [];
  }
}

/**
 * Helper function to automatically extract parameter name when not provided
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
      if (parameterIndex < paramNames.length) {
        return paramNames[parameterIndex];
      }
    }
  } catch (_error: unknown) {
    // If we can't get the parameter name, return undefined
    // This will use default naming in the execution logic
  }

  return undefined;
}

/**
 * Checks if a parameter string contains actual parameters
 *
 * @param paramsStr - The parameter string to check
 * @returns True if the string contains parameters, false otherwise
 */
function hasParameters(paramsStr: string): boolean {
  return (
    paramsStr !== null && paramsStr !== undefined && paramsStr.trim() !== ''
  );
}

/**
 * Extracts the parameter string from a function string representation
 *
 * @param fnStr - The string representation of the function
 * @returns The parameter string, or empty string if not found
 */
function extractParameterString(fnStr: string): string {
  // Handle arrow functions that start with parentheses
  if (fnStr.startsWith('(')) {
    const endParenIndex = findClosingParenthesis(fnStr, 0);
    if (endParenIndex === -1) return '';
    return fnStr.substring(1, endParenIndex);
  }

  // Handle regular functions, async functions, and methods
  const startParenIndex = fnStr.indexOf('(');
  if (startParenIndex === -1) return '';

  const endParenIndex = findClosingParenthesis(fnStr, startParenIndex);
  if (endParenIndex === -1) return '';

  return fnStr.substring(startParenIndex + 1, endParenIndex);
}

/**
 * Finds the matching closing parenthesis for an opening parenthesis
 *
 * @param str - The string to search in
 * @param openingParenIndex - The index of the opening parenthesis
 * @returns The index of the matching closing parenthesis, or -1 if not found
 */
function findClosingParenthesis(
  str: string,
  openingParenIndex: number,
): number {
  let parenDepth = 1;

  for (let i = openingParenIndex + 1; i < str.length; i++) {
    const char = str[i];

    if (char === '(') {
      parenDepth++;
    } else if (char === ')') {
      parenDepth--;
      if (parenDepth === 0) {
        return i;
      }
    }
  }

  return -1; // No matching closing parenthesis found
}

/**
 * Parses and cleans parameter names from a parameter string
 *
 * @param paramsStr - The parameter string to parse
 * @returns An array of cleaned parameter names
 */
function parseParameterNames(paramsStr: string): string[] {
  return paramsStr
    .split(',')
    .map(trimWhitespace)
    .filter(isNotEmpty)
    .map(extractParameterName);
}

/**
 * Trims whitespace from a string
 *
 * @param str - The string to trim
 * @returns The trimmed string
 */
function trimWhitespace(str: string): string {
  return str.trim();
}

/**
 * Checks if a string is not empty
 *
 * @param str - The string to check
 * @returns True if the string is not empty, false otherwise
 */
function isNotEmpty(str: string): boolean {
  return str.length > 0;
}

/**
 * Extracts a clean parameter name by removing type annotations and default values
 *
 * @param param - The raw parameter string
 * @returns The cleaned parameter name
 */
function extractParameterName(param: string): string {
  // Remove default value assignment (everything after =)
  let cleanedParam = removeDefaultValue(param);

  // Remove type annotations (everything after :)
  cleanedParam = removeTypeAnnotation(cleanedParam);

  return cleanedParam.trim();
}

/**
 * Removes default value from a parameter string
 *
 * @param param - The parameter string
 * @returns The parameter string without default value
 */
function removeDefaultValue(param: string): string {
  const equalsIndex = param.indexOf('=');
  if (equalsIndex !== -1) {
    return param.substring(0, equalsIndex);
  }
  return param;
}

/**
 * Removes type annotation from a parameter string
 *
 * @param param - The parameter string
 * @returns The parameter string without type annotation
 */
function removeTypeAnnotation(param: string): string {
  const colonIndex = param.indexOf(':');
  if (colonIndex !== -1) {
    return param.substring(0, colonIndex);
  }
  return param;
}
