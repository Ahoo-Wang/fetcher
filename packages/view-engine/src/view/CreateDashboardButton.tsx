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
import type { ViewEngine } from '../engine/ViewEngine.js';
import { useViewCapabilities } from './useViewCapabilities.js';
import { Button } from '../components/ui/button.js';
import { Input } from '../components/ui/input.js';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../components/ui/dialog.js';

export function CreateDashboardButton({
  engine,
  onCreated,
}: {
  engine: ViewEngine;
  onCreated?(): void;
}) {
  const capabilities = useViewCapabilities(engine);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [shared, setShared] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (!capabilities.createPersonal && !capabilities.createShared) return null;
  return (
    <>
      <Button
        variant="outline"
        onClick={() => {
          setOpen(true);
          setError(null);
          setShared(!capabilities.createPersonal);
        }}
      >
        新建仪表盘
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <form
            onSubmit={event => {
              event.preventDefault();
              try {
                engine.createDashboard({
                  title,
                  scope: shared
                    ? { type: 'public', source: 'shared' }
                    : { type: 'personal' },
                });
                setOpen(false);
                setTitle('');
                onCreated?.();
              } catch (error) {
                setError(error instanceof Error ? error.message : '创建失败');
              }
            }}
          >
            <DialogHeader>
              <DialogTitle>新建仪表盘</DialogTitle>
              <DialogDescription>
                添加已保存的视图组成业务概览。点击保存后才会创建保存实例；共享不会授予子视图访问权限。
              </DialogDescription>
            </DialogHeader>
            <div className="fve:my-4 fve:flex fve:flex-col fve:gap-4">
              <label className="fve:flex fve:flex-col fve:gap-2 fve:text-sm">
                名称
                <Input
                  autoFocus
                  value={title}
                  onChange={event => setTitle(event.target.value)}
                  required
                  maxLength={200}
                />
              </label>
              <label className="fve:flex fve:flex-col fve:gap-2 fve:text-sm">
                可见范围
                <select
                  className="fve:h-9 fve:rounded-md fve:border fve:bg-background fve:px-2"
                  aria-label="新仪表盘可见范围"
                  value={shared ? 'shared' : 'personal'}
                  onChange={event => setShared(event.target.value === 'shared')}
                >
                  {capabilities.createPersonal && (
                    <option value="personal">个人</option>
                  )}
                  {capabilities.createShared && (
                    <option value="shared">共享</option>
                  )}
                </select>
              </label>
              {error && <p role="alert">{error}</p>}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                取消
              </Button>
              <Button type="submit" disabled={!title.trim()}>
                创建草稿
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
