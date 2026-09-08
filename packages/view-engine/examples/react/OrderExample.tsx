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

import { useState } from 'react';
import {
  LocalStorageViewHost,
  HttpViewHost,
  type HttpViewHostOptions,
  type LocalStorageViewHostOptions,
} from '@ahoo-wang/fetcher-view-engine';
import { Button, ViewPage } from '@ahoo-wang/fetcher-view-engine/react';
import '@ahoo-wang/fetcher-view-engine/styles.css';
import { orderDefinition, orderViews } from './orders.js';
import {
  createOrderService,
  type OrderServiceOptions,
} from './orderService.js';
import { OrderOperationsProvider } from './OrderOperations.js';
import { orderExtensions } from './OrderExtensions.js';

export interface OrderExampleProps extends OrderServiceOptions {
  scopeKey?: string;
  appearance?: 'light' | 'dark';
  initialSidebarCollapsed?: boolean;
  /** Development-only persistence of view configuration in this browser. */
  persistViews?: boolean;
  /** HTTP contract fixture; authentication belongs to the embedding application. */
  viewServiceUrl?: string;
  viewServiceTimeoutMs?: number;
  accessToken?: string;
}
/** Copy this directory into a React app and render <OrderExample scopeKey="user:tenant:access" />. */
export function OrderExample({
  scopeKey = 'local-user:demo-orders',
  persistViews = false,
  viewServiceUrl,
  ...props
}: OrderExampleProps) {
  return (
    <ScopedOrders
      key={JSON.stringify([scopeKey, persistViews, viewServiceUrl])}
      scopeKey={scopeKey}
      persistViews={persistViews}
      viewServiceUrl={viewServiceUrl}
      {...props}
    />
  );
}
function ScopedOrders({
  scopeKey,
  appearance = 'light',
  initialSidebarCollapsed = true,
  persistViews = false,
  viewServiceUrl,
  viewServiceTimeoutMs,
  accessToken,
  ...options
}: OrderExampleProps & { scopeKey: string }) {
  // One local service per access scope; production hosts should enforce the same scope server-side.
  const [service] = useState(() => createOrderService(options));
  const localOptions: LocalStorageViewHostOptions | null = persistViews
    ? {
        scopeKey,
        storage: localStorage,
        serviceKey: 'demo-view-service',
        lock: (name, operation, signal) =>
          navigator.locks.request(name, { signal }, operation),
        definition: orderDefinition,
        instances: orderViews,
        resolveSource: (id: string) => service.host.resolveSource(id),
      }
    : null;
  const remoteOptions: HttpViewHostOptions | null = viewServiceUrl
    ? {
        baseUrl: viewServiceUrl,
        timeoutMs: viewServiceTimeoutMs,
        definitionId: orderDefinition.id,
        headers: (): HeadersInit =>
          accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
        resolveSource: id => service.host.resolveSource(id),
      }
    : null;
  const [host, setHost] = useState(() =>
    remoteOptions
      ? new HttpViewHost(remoteOptions)
      : localOptions
        ? new LocalStorageViewHost(localOptions)
        : service.host,
  );
  const [generation, setGeneration] = useState(0);
  const [storageError, setStorageError] = useState<string>();
  function reopen() {
    if (remoteOptions) setHost(new HttpViewHost(remoteOptions));
    else if (localOptions) setHost(new LocalStorageViewHost(localOptions));
    setGeneration(value => value + 1);
  }
  return (
    <div
      className="fve-root"
      data-theme={appearance}
      style={{ padding: 12, minWidth: 0, background: 'var(--fve-background)' }}
    >
      <p style={{ marginTop: 0 }}>
        {viewServiceUrl
          ? 'HTTP 视图服务契约验证；业务记录由独立订单服务提供。'
          : persistViews
            ? '浏览器保存视图配置；刷新页面后订单数据恢复初始值。'
            : '本地订单演示，修改仅保留在当前页面。'}
      </p>
      {(host instanceof LocalStorageViewHost ||
        host instanceof HttpViewHost) && (
        <div className="fve:mb-3 fve:flex fve:gap-2">
          <Button variant="outline" onClick={reopen}>
            重新打开已保存视图
          </Button>
          {host instanceof LocalStorageViewHost ? (
            <Button
              variant="outline"
              onClick={async () => {
                try {
                  await host.reset();
                  setStorageError(undefined);
                  reopen();
                } catch (error) {
                  setStorageError(
                    error instanceof Error ? error.message : '本地存储重置失败',
                  );
                }
              }}
            >
              重置测试服务
            </Button>
          ) : (
            <Button
              variant="outline"
              onClick={async () => {
                try {
                  await host.refreshPermissions();
                  setStorageError(undefined);
                } catch (error) {
                  setStorageError(
                    error instanceof Error ? error.message : '权限同步失败',
                  );
                }
              }}
            >
              同步服务权限
            </Button>
          )}
        </div>
      )}
      {storageError && <p role="alert">{storageError}</p>}
      <OrderOperationsProvider service={service}>
        {busy => (
          <ViewPage
            key={generation}
            scopeKey={scopeKey}
            definitionId={orderDefinition.id}
            {...(!persistViews &&
              !viewServiceUrl && {
                definition: orderDefinition,
                instances: orderViews,
              })}
            host={host}
            extensions={orderExtensions}
            selectable
            autoRefreshPaused={busy}
            initialSidebarCollapsed={initialSidebarCollapsed}
          />
        )}
      </OrderOperationsProvider>
    </div>
  );
}
