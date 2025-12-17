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

import { RouteGuardProps } from './RouteGuard';
import { ReactNode, useEffect } from 'react';
import { JwtTokenManager } from '@ahoo-wang/fetcher-cosec';
import { useSecurityContext } from './SecurityContext';

export interface RefreshableRouteGuardProps extends Omit<RouteGuardProps, 'onUnauthorized'> {
  refreshing?: ReactNode;
  tokenManager: JwtTokenManager;
}

export function RefreshableRouteGuard({
                                        children,
                                        fallback,
                                        refreshing,
                                        tokenManager,
                                      }: RefreshableRouteGuardProps) {
  const { authenticated } = useSecurityContext();
  const refreshable = tokenManager.isRefreshNeeded && tokenManager.isRefreshable;

  useEffect(() => {
    if (refreshable) {
      tokenManager.refresh();
    }
  }, [refreshable, tokenManager]);

  if (authenticated) {
    return <>{children}</>;
  }

  if (!refreshable) {
    return <>{fallback}</>;
  }
  const refreshingNode = refreshing ?? <p>Refreshing...</p>;
  return <>{refreshingNode}</>;

}