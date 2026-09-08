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

import { Button, Empty } from 'antd';
import { useState } from 'react';
import type { ViewType } from './types';
import { SaveViewModal } from './panel/SaveViewModal';

export function EmptyViewer({
  onCreateView,
}: {
  onCreateView?: (name: string, type: ViewType, onSuccess: () => void) => void;
}) {
  const [creating, setCreating] = useState(false);
  return (
    <Empty description="未找到视图">
      {onCreateView && (
        <Button type="primary" onClick={() => setCreating(true)}>
          创建视图
        </Button>
      )}
      <SaveViewModal
        mode="Create"
        open={creating}
        onCancel={() => setCreating(false)}
        onSaveView={(name, type) => {
          onCreateView?.(name, type, () => setCreating(false));
        }}
      />
    </Empty>
  );
}
