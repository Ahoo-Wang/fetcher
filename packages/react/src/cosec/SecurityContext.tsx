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

import { useSecurity, UseSecurityReturn } from './useSecurity';
import { createContext, ReactNode, useContext } from 'react';
import { TokenStorage } from '@ahoo-wang/fetcher-cosec';

/**
 * Type alias for the security context value, which is the same as the return type of useSecurity hook.
 * Provides access to current user information, authentication status, and authentication methods.
 */
export type SecurityContext = UseSecurityReturn;

/**
 * React context for managing authentication state across the component tree.
 * This context provides a way to share authentication state and methods between components
 * without prop drilling. It should be used with SecurityProvider to wrap the application.
 */
export const SecurityContext = createContext<SecurityContext | undefined>(
  undefined,
);

/**
 * Props for the SecurityProvider component.
 */
export interface SecurityContextOptions {
  /**
   * The token storage instance used to manage authentication tokens.
   * This should be a valid TokenStorage implementation that handles token persistence and retrieval.
   */
  tokenStorage: TokenStorage;

  /**
   * The child components that will have access to the security context.
   */
  children: ReactNode;
}

/**
 * Provider component that supplies authentication state and methods to its child components.
 * This component wraps the application or a portion of it to provide access to authentication
 * functionality through the useSecurityContext hook.
 *
 * @param tokenStorage - The token storage instance for managing authentication tokens.
 * @param children - The child components that will have access to the security context.
 * @returns A React element that provides the security context to its children.
 * @throws {Error} May throw errors if tokenStorage operations fail during initialization.
 * @example
 * ```tsx
 * import { SecurityProvider } from '@ahoo-wang/fetcher-react';
 * import { tokenStorage } from './tokenStorage';
 *
 * function App() {
 *   return (
 *     <SecurityProvider tokenStorage={tokenStorage}>
 *       <MyApp />
 *     </SecurityProvider>
 *   );
 * }
 * ```
 */
export function SecurityProvider({
  tokenStorage,
  children,
}: SecurityContextOptions) {
  const value = useSecurity(tokenStorage);
  return (
    <SecurityContext.Provider value={value}>
      {children}
    </SecurityContext.Provider>
  );
}

/**
 * Hook to access the security context within components wrapped by SecurityProvider.
 * This hook provides reactive access to authentication state and methods throughout the component tree.
 *
 * @returns The security context containing currentUser, authenticated status, signIn, and signOut methods.
 * @throws {Error} Throws an error if used outside of a SecurityProvider component.
 * @example
 * ```tsx
 * import { useSecurityContext } from '@ahoo-wang/fetcher-react';
 *
 * function UserProfile() {
 *   const { currentUser, authenticated, signOut } = useSecurityContext();
 *
 *   if (!authenticated) {
 *     return <div>Please sign in</div>;
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
export function useSecurityContext(): SecurityContext {
  const context = useContext(SecurityContext);
  if (!context) {
    throw new Error(
      'useSecurityContext must be used within a SecurityProvider',
    );
  }
  return context;
}
