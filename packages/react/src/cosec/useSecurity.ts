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

import { useCallback } from 'react';
import { useKeyStorage } from '../storage';
import {
  TokenStorage,
  CompositeToken,
  CoSecJwtPayload,
} from '@ahoo-wang/fetcher-cosec';

export const ANONYMOUS_USER: CoSecJwtPayload = {
  sub: 'anonymous',
};

/**
 * Return type for the useSecurity hook.
 */
export interface UseSecurityReturn {
  /**
   * The current authenticated user's JWT payload, or null if not authenticated.
   * Contains user information extracted from the access token.
   */
  currentUser: CoSecJwtPayload;

  /**
   * Boolean indicating whether the user is currently authenticated.
   * True if a valid token exists and the user is signed in, false otherwise.
   */
  authenticated: boolean;

  /**
   * Function to sign in with a composite token.
   * @param compositeToken - The composite token containing access and refresh tokens.
   */
  signIn: (compositeToken: CompositeToken) => void;

  /**
   * Function to sign out the current user.
   */
  signOut: () => void;
}

/**
 * Hook for managing authentication state and operations using CoSec tokens.
 *
 * This hook provides reactive access to the current user information, authentication status,
 * and methods to sign in and sign out. It integrates with the TokenStorage to persist tokens
 * and updates the state reactively when tokens change.
 *
 * @param tokenStorage - The token storage instance used to manage authentication tokens.
 *                      This should be a valid TokenStorage implementation that handles
 *                      token persistence and retrieval.
 * @returns An object containing:
 *          - currentUser: The current authenticated user's JWT payload, or null if not authenticated.
 *          - authenticated: Boolean indicating whether the user is currently authenticated.
 *          - signIn: Function to authenticate with a composite token.
 *          - signOut: Function to sign out the current user.
 * @throws {Error} May throw errors if tokenStorage operations fail, such as invalid tokens
 *                 or storage access issues (implementation dependent).
 * @example
 * ```typescript
 * import { useSecurity } from '@ahoo-wang/fetcher-react/cosec';
 * import { tokenStorage } from './tokenStorage';
 *
 * function App() {
 *   const { currentUser, authenticated, signIn, signOut } = useSecurity(tokenStorage);
 *
 *   if (!authenticated) {
 *     return <button onClick={() => signIn(compositeToken)}>Sign In</button>;
 *   }
 *
 *   return (
 *     <div>
 *       <p>Welcome, {currentUser?.sub}!</p>
 *       <button onClick={signOut}>Sign Out</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useSecurity(tokenStorage: TokenStorage): UseSecurityReturn {
  // Use useKeyStorage to get reactive updates when token changes
  const [token, , remove] = useKeyStorage(tokenStorage);
  const signIn = useCallback(
    (compositeToken: CompositeToken) => {
      tokenStorage.signIn(compositeToken);
    },
    [tokenStorage],
  );
  return {
    currentUser: token?.access?.payload ?? ANONYMOUS_USER,
    authenticated: token?.authenticated ?? false,
    signIn,
    signOut: remove,
  };
}
