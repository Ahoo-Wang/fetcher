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
import { ViewPage } from '@ahoo-wang/fetcher-view-engine/react';
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
}
/** Copy this directory into a React app and render <OrderExample scopeKey="user:tenant:access" />. */
export function OrderExample({
  scopeKey = 'local-user:demo-orders',
  ...props
}: OrderExampleProps) {
  return <ScopedOrders key={scopeKey} scopeKey={scopeKey} {...props} />;
}
function ScopedOrders({
  scopeKey,
  appearance = 'light',
  initialSidebarCollapsed = true,
  ...options
}: OrderExampleProps & { scopeKey: string }) {
  // One local service per access scope; production hosts should enforce the same scope server-side.
  const [service] = useState(() => createOrderService(options));
  return (
    <div
      className="fve-root"
      data-theme={appearance}
      style={{ padding: 12, minWidth: 0, background: 'var(--fve-background)' }}
    >
      <p style={{ marginTop: 0 }}>本地订单演示，修改仅保留在当前页面。</p>
      <OrderOperationsProvider service={service}>
        {busy => (
          <ViewPage
            scopeKey={scopeKey}
            definitionId={orderDefinition.id}
            definition={orderDefinition}
            instances={orderViews}
            host={service.host}
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
