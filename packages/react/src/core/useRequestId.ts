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

import { useRef, useCallback } from 'react';

/**
 * Return type for useRequestId hook
 */
export interface UseRequestIdReturn {
  /** Generate a new request ID and get the current one */
  generate: () => number;
  /** Get the current request ID without generating a new one */
  current: () => number;
  /** Check if a given request ID is the latest */
  isLatest: (requestId: number) => boolean;
  /** Invalidate current request ID (mark as stale) */
  invalidate: () => void;
  /** Reset request ID counter */
  reset: () => void;
}

/**
 * A React hook for managing request IDs and race condition protection
 *
 * @example
 * ```typescript
 * // Basic usage
 * const requestId = useRequestId();
 *
 * const execute = async () => {
 *   const id = requestId.generate();
 *
 *   try {
 *     const result = await someAsyncOperation();
 *
 *     // Check if this is still the latest request
 *     if (requestId.isLatest(id)) {
 *       setState(result);
 *     }
 *   } catch (error) {
 *     if (requestId.isLatest(id)) {
 *       setError(error);
 *     }
 *   }
 * };
 *
 * // Manual cancellation
 * const handleCancel = () => {
 *   requestId.invalidate(); // All ongoing requests will be ignored
 * };
 * ```
 *
 * @example
 * ```typescript
 * // With async operation wrapper
 * const { execute, cancel } = useAsyncOperation(async (data) => {
 *   return await apiCall(data);
 * }, [requestId]);
 * ```
 */
export function useRequestId(): UseRequestIdReturn {
  const requestIdRef = useRef<number>(0);

  const generate = useCallback((): number => {
    return ++requestIdRef.current;
  }, []);

  const current = useCallback((): number => {
    return requestIdRef.current;
  }, []);

  const isLatest = useCallback((requestId: number): boolean => {
    return requestId === requestIdRef.current;
  }, []);

  const invalidate = useCallback((): void => {
    requestIdRef.current++;
  }, []);

  const reset = useCallback((): void => {
    requestIdRef.current = 0;
  }, []);

  return {
    generate,
    current,
    isLatest,
    invalidate,
    reset,
  };
}