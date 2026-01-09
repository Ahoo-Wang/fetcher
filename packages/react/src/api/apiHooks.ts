/**
 * Shared utilities and types for API hooks generation.
 */

/**
 * Converts a method name to a React hook name by prefixing with 'use' and capitalizing the first letter.
 * @param methodName - The method name to convert.
 * @returns The converted hook name.
 * @throws {Error} If methodName is empty or null.
 * @example
 * methodNameToHookName('getUser') // 'useGetUser'
 * methodNameToHookName('createPost') // 'useCreatePost'
 * methodNameToHookName('APIGetData') // 'useAPIGetData'
 */
export function methodNameToHookName(methodName: string): string {
  if (!methodName || methodName.length === 0) {
    throw new Error('Method name cannot be empty');
  }

  // Capitalize the first character and keep the rest unchanged
  const capitalized = methodName.charAt(0).toUpperCase() + methodName.slice(1);
  return `use${capitalized}`;
}

/**
 * Collects all function methods from an object and its prototype chain.
 * @param obj - The object to collect methods from.
 * @returns A map of method names to bound methods.
 */
export function collectMethods<T extends (...args: any[]) => Promise<any>>(
  obj: Record<string, any>,
): Map<string, T> {
  const methods = new Map<string, T>();
  const processedKeys = new Set<string>();

  // Helper function to process an object for methods
  const processObject = (target: Record<string, any>) => {
    Object.getOwnPropertyNames(target).forEach(key => {
      if (!processedKeys.has(key) && key !== 'constructor') {
        processedKeys.add(key);
        const value = target[key];
        if (typeof value === 'function') {
          // Bind method to the original object to preserve 'this' context
          methods.set(key, value.bind(obj) as T);
        }
      }
    });
  };

  // Process own properties first
  processObject(obj);

  // Process prototype chain
  let proto = Object.getPrototypeOf(obj);
  while (proto && proto !== Object.prototype) {
    processObject(proto);
    proto = Object.getPrototypeOf(proto);
  }

  return methods;
}

// ============================================================================
// Type Utilities
// ============================================================================

/**
 * Common configuration options for API hooks creation functions.
 * @template API - The API object type.
 */
export interface CreateApiHooksOptions<API extends Record<string, any>> {
  /**
   * The API object containing methods to be wrapped into hooks.
   */
  api: API;
}

/**
 * Utility type to extract the hook name from a method name.
 * @template K - The method name key.
 */
export type HookName<K extends string> = `use${Capitalize<K>}`;

/**
 * Utility type to check if a value is a function that returns a Promise.
 * @template T - The value to check.
 */
export type IsPromiseFunction<T> = T extends (...args: any[]) => Promise<any>
  ? true
  : false;

/**
 * Utility type to extract the parameters of a promise-returning function.
 * @template T - The function type.
 */
export type FunctionParameters<T> = T extends (...args: infer P) => Promise<any>
  ? P
  : never;

/**
 * Utility type to extract the resolved return type of a promise-returning function.
 * @template T - The function type.
 */
export type FunctionReturnType<T> = T extends (
  ...args: any[]
) => Promise<infer R>
  ? Awaited<R>
  : never;

/**
 * Utility type for API method signatures.
 * @template TArgs - Parameter types.
 * @template TReturn - Return type.
 */
export type ApiMethod<TArgs extends any[] = any[], TReturn = any> = (
  ...args: TArgs
) => Promise<TReturn>;

/**
 * Utility type for query method signatures (with query, attributes, abortController).
 * @template Q - Query type.
 * @template TReturn - Return type.
 */
export type QueryMethod<Q = any, TReturn = any> = (
  query: Q,
  attributes?: Record<string, any>,
  abortController?: AbortController,
) => Promise<TReturn>;

/**
 * Common callback type for pre-execution hooks.
 * @template TParams - The parameters type passed to the callback.
 */
export type OnBeforeExecuteCallback<TParams> = (
  abortController: AbortController | undefined,
  params: TParams,
) => void;

/**
 * Utility type to create API hooks mapping.
 * @template API - The API object type.
 * @template MethodType - The method signature type.
 * @template HookType - The hook function type.
 * @template E - Error type.
 */
export type ApiHooksMapping<
  API extends Record<string, any>,
  MethodType extends (...args: any[]) => Promise<any>,
  HookType,
> = {
  [K in keyof API as API[K] extends MethodType
    ? HookName<string & K>
    : never]: API[K] extends MethodType ? HookType : never;
};
