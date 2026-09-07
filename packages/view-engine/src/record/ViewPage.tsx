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

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { RecordViewProps } from './RecordView.js';
import { ViewEngine } from './ViewEngine.js';
import { ViewPageContent } from './page/ViewPageContent.js';
import type { ViewEngineOptions } from './recordModel.js';

export { ViewPageContent } from './page/ViewPageContent.js';
export type { ViewPageContentProps } from './page/ViewPageContent.js';

export interface ViewPageProps
  extends ViewEngineOptions, Omit<RecordViewProps, 'engine' | 'toolbarStart'> {
  /** Stable user/tenant/access identity. Changing it creates an isolated session. */
  scopeKey: string;
  initialSidebarCollapsed?: boolean;
}
/** Owns one engine per explicit scope and definition. Local data initializes that lifetime. */
export function ViewPage(props: ViewPageProps) {
  if (typeof props.scopeKey !== 'string' || !props.scopeKey.trim())
    return (
      <div className="fve-root fve:p-4" role="alert">
        scopeKey 必须标识当前用户与访问范围
      </div>
    );
  return (
    <OwnedViewPage
      key={JSON.stringify([props.scopeKey, props.definitionId])}
      {...props}
    />
  );
}
function OwnedViewPage(props: ViewPageProps) {
  const hostRef = useRef(props.host);
  const [, reflectHost] = useState(0);
  useLayoutEffect(() => {
    if (hostRef.current === props.host) return;
    hostRef.current = props.host;
    // Reflect committed capabilities without replacing the engine or its sessions.
    reflectHost(version => version + 1);
  }, [props.host]);
  const [initial] = useState(() => ({
    definitionId: props.definitionId,
    definition: props.definition,
    instances: props.instances,
  }));
  const [owned, setOwned] = useState<{
    engine: ViewEngine | null;
    error?: string;
  } | null>(null);
  useEffect(() => {
    const options: ViewEngineOptions = {
      ...initial,
      // Resolve optional methods at call time; each scope owns a separate adapter.
      host: new Proxy({} as ViewEngineOptions['host'], {
        get(_target, property) {
          const host = hostRef.current;
          const value = Reflect.get(host, property, host);
          return typeof value === 'function' ? value.bind(host) : value;
        },
      }),
    };
    let engine: ViewEngine;
    try {
      engine = new ViewEngine(options);
    } catch (error) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- report invalid local input from external resource creation.
      setOwned({
        engine: null,
        error: error instanceof Error ? error.message : '视图数据无效',
      });
      return;
    }
    // A fresh subscription owner on every effect setup also supports React StrictMode cleanup/replay.
    setOwned({ engine });
    void engine.load().catch(() => {});
    return () => engine.dispose();
  }, [initial]);
  if (!owned)
    return (
      <div className="fve-root fve:p-4" role="status">
        正在加载视图…
      </div>
    );
  if (!owned.engine)
    return (
      <div className="fve-root fve:p-4" role="alert">
        {owned.error}
      </div>
    );
  return (
    <ViewPageContent
      key={props.definitionId}
      engine={owned.engine}
      extensions={props.extensions}
      filterContext={props.filterContext}
      selectable={props.selectable}
      autoRefreshPaused={props.autoRefreshPaused}
      className={props.className}
      initialSidebarCollapsed={props.initialSidebarCollapsed}
    />
  );
}
