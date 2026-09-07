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

import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import {
  ChevronDownIcon,
  PanelLeftCloseIcon,
  PanelLeftOpenIcon,
  SaveIcon,
  CopyIcon,
  RotateCcwIcon,
  Settings2Icon,
  CheckIcon,
} from 'lucide-react';
import { useViewExpansion, ViewExpansionContext } from './viewExpansion.js';
import { ViewManager } from './ViewManager.js';
import { ViewEngine } from './ViewEngine.js';
import { RecordView, type RecordViewProps } from './RecordView.js';
import type {
  RecordSession,
  SaveAsScope,
  ViewEngineOptions,
} from './recordModel.js';
import { Button } from '../components/ui/button.js';
import { ButtonGroup } from '../components/ui/button-group.js';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '../components/ui/dropdown-menu.js';
import { Input } from '../components/ui/input.js';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog.js';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select.js';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group.js';
import { cn } from '../lib/utils.js';

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
const GROUPS = [
  { id: 'personal', label: '个人视图' },
  { id: 'public', label: '公共视图' },
] as const;
function instanceLabel(session: RecordSession, showPending = true) {
  return `${session.instance.title}${showPending && session.dirty ? ' · 已编辑' : ''}${showPending && session.filterPending ? ' · 待查询' : ''}`;
}
function ViewInstanceLabel({
  session,
  showPending,
}: {
  session: RecordSession;
  showPending: boolean;
}) {
  return (
    <span className="fve:flex fve:w-full fve:min-w-0 fve:items-center fve:gap-2">
      <span className="fve:min-w-0 fve:flex-1">
        {instanceLabel(session, showPending)}
      </span>
      {session.instance.scope.type === 'public' &&
        session.instance.scope.source === 'system' && (
          <span className="fve:inline-flex fve:h-5 fve:shrink-0 fve:items-center fve:justify-center fve:rounded-4xl fve:border fve:border-border fve:px-2 fve:py-0.5 fve:text-xs fve:font-medium fve:whitespace-nowrap fve:text-foreground">
            系统
          </span>
        )}
    </span>
  );
}
export interface ViewPageContentProps extends Omit<
  RecordViewProps,
  'toolbarStart'
> {
  initialSidebarCollapsed?: boolean;
}
/** Compose a caller-owned engine into the same page UI without transferring lifecycle ownership. */
export function ViewPageContent({
  engine,
  initialSidebarCollapsed = false,
  className,
  ...recordProps
}: ViewPageContentProps) {
  const state = useSyncExternalStore(
    engine.subscribe,
    engine.getSnapshot,
    engine.getSnapshot,
  );
  const pageRef = useRef<HTMLDivElement>(null);
  const expansion = useViewExpansion(pageRef, state.status === 'ready');
  const [collapsed, setCollapsed] = useState(initialSidebarCollapsed);
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const [managerOpen, setManagerOpen] = useState(false);
  const switcherTrigger = useRef<HTMLButtonElement>(null);
  const managerReturnFocus = useRef<HTMLElement>(null);
  const [actionError, setActionError] = useState<{
    instanceId: string | null;
    message: string;
  } | null>(null);
  const id = state.selectedInstanceId;
  const session = id ? state.sessions[id] : undefined;
  function run(action: () => void | Promise<void>) {
    const instanceId = engine.getSnapshot().selectedInstanceId;
    setActionError(null);
    try {
      void Promise.resolve(action()).catch(error =>
        setActionError({
          instanceId,
          message: error instanceof Error ? error.message : '操作失败',
        }),
      );
    } catch (error) {
      setActionError({
        instanceId,
        message: error instanceof Error ? error.message : '操作失败',
      });
    }
  }
  if (state.status === 'idle' || state.status === 'loading')
    return (
      <div className="fve-root fve:p-4" role="status">
        正在加载视图…
      </div>
    );
  if (state.status === 'error')
    return (
      <div className="fve-root fve:flex fve:flex-col fve:items-start fve:gap-3 fve:p-4">
        <p role="alert">{state.error}</p>
        <Button variant="outline" onClick={() => run(() => engine.load())}>
          重新加载视图
        </Button>
      </div>
    );
  const currentActionError =
    actionError?.instanceId === id ? actionError.message : null;
  const groups = GROUPS.map(group => ({
    ...group,
    sessions: state.instanceIds
      .map(id => state.sessions[id])
      .filter(session => session.instance.scope.type === group.id),
  })).filter(group => group.sessions.length);
  const toolbarStart = (
    <div className="fve:flex fve:min-w-0 fve:flex-wrap fve:items-center fve:gap-2">
      {collapsed && (
        <Button
          variant="ghost"
          size="icon"
          className="fve:hidden fve:@min-[64rem]:inline-flex"
          aria-label="展开视图列表"
          onClick={() => setCollapsed(false)}
        >
          <PanelLeftOpenIcon aria-hidden="true" />
        </Button>
      )}
      <h1 className="fve:text-lg fve:font-semibold">
        {state.definition?.title}
      </h1>
      <div
        className={cn(
          'fve:max-w-full',
          !collapsed && 'fve:@min-[64rem]:hidden',
        )}
      >
        <Select<string | null>
          open={switcherOpen}
          onOpenChange={setSwitcherOpen}
          value={id}
          items={state.instanceIds.map(id => ({
            value: id,
            label: instanceLabel(
              state.sessions[id],
              id !== state.selectedInstanceId,
            ),
          }))}
          onValueChange={next => {
            setSwitcherOpen(false);
            if (next !== null) run(() => engine.selectInstance(next));
          }}
        >
          <SelectTrigger ref={switcherTrigger} aria-label="选择视图实例">
            <SelectValue placeholder="选择视图">
              {session?.instance.title}
            </SelectValue>
          </SelectTrigger>
          <SelectContent
            alignItemWithTrigger={false}
            align="start"
            finalFocus={!managerOpen}
            footer={
              <Button
                variant="ghost"
                size="sm"
                className="fve:w-full fve:justify-start"
                onClick={() => {
                  managerReturnFocus.current = switcherTrigger.current;
                  setSwitcherOpen(false);
                  setManagerOpen(true);
                }}
              >
                <Settings2Icon aria-hidden="true" />
                管理视图
              </Button>
            }
          >
            {groups.map(group => (
              <SelectGroup key={group.id}>
                <SelectLabel>{group.label}</SelectLabel>
                {group.sessions.map(item => (
                  <SelectItem key={item.instance.id} value={item.instance.id}>
                    <ViewInstanceLabel
                      session={item}
                      showPending={item.instance.id !== id}
                    />
                  </SelectItem>
                ))}
              </SelectGroup>
            ))}
          </SelectContent>
        </Select>
      </div>
      {session && (
        <span
          className={cn(
            'fve:text-sm fve:text-muted-foreground',
            collapsed ? 'fve:hidden' : 'fve:hidden fve:@min-[64rem]:inline',
          )}
        >
          {session.instance.title}
        </span>
      )}
      {session && (
        <ViewInstanceActions
          key={session.instance.id}
          engine={engine}
          session={session}
          run={run}
        />
      )}
    </div>
  );
  return (
    <ViewExpansionContext.Provider value={expansion}>
      <div
        ref={pageRef}
        className={cn(
          'fve-root fve:@container fve:flex fve:min-w-0 fve:gap-4 fve:bg-background fve:p-3 fve:text-foreground',
          className,
        )}
        data-slot="view-page"
      >
        {/* Keep management mounted when the popup closes or the selected record view changes. */}
        <div className="fve:absolute">
          <ViewManager
            engine={engine}
            groups={groups}
            open={managerOpen}
            onOpenChange={setManagerOpen}
            finalFocus={() => {
              const target = managerReturnFocus.current;
              return target?.isConnected && target.getClientRects().length
                ? target
                : switcherTrigger.current;
            }}
          />
        </div>
        {!collapsed && (
          <aside
            aria-label="视图列表"
            className="fve:hidden fve:w-52 fve:shrink-0 fve:flex-col fve:gap-3 fve:border-r fve:pr-3 fve:@min-[64rem]:flex"
          >
            <div className="fve:flex fve:items-center fve:justify-between fve:gap-2">
              <span className="fve:font-medium">视图</span>
              <div className="fve:flex fve:items-center fve:gap-1">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="管理视图"
                  title="管理视图"
                  onClick={event => {
                    managerReturnFocus.current = event.currentTarget;
                    setManagerOpen(true);
                  }}
                >
                  <Settings2Icon aria-hidden="true" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="收起视图列表"
                  onClick={() => setCollapsed(true)}
                >
                  <PanelLeftCloseIcon aria-hidden="true" />
                </Button>
              </div>
            </div>
            {groups.map(group => (
              <section
                key={group.id}
                className="fve:flex fve:flex-col fve:gap-1"
              >
                <h3 className="fve:px-2 fve:py-1 fve:text-xs fve:font-medium fve:text-muted-foreground">
                  {group.label}
                </h3>
                {group.sessions.map(item => (
                  <Button
                    key={item.instance.id}
                    variant={id === item.instance.id ? 'secondary' : 'ghost'}
                    className="fve:h-auto fve:min-h-8 fve:justify-start fve:whitespace-normal fve:break-words fve:text-left"
                    aria-current={id === item.instance.id ? 'page' : undefined}
                    onClick={() =>
                      run(() => engine.selectInstance(item.instance.id))
                    }
                  >
                    <ViewInstanceLabel
                      session={item}
                      showPending={item.instance.id !== id}
                    />
                  </Button>
                ))}
              </section>
            ))}
          </aside>
        )}
        <main
          tabIndex={-1}
          aria-label="视图工作区"
          className="fve:flex fve:min-w-0 fve:flex-1 fve:flex-col fve:gap-3"
        >
          {!session && <header>{toolbarStart}</header>}
          {(state.error || currentActionError || session?.writeError) && (
            <div
              role="alert"
              className="fve:flex fve:flex-wrap fve:items-center fve:gap-2 fve:rounded-lg fve:border fve:border-destructive/30 fve:p-3 fve:text-sm fve:text-destructive"
            >
              <span>
                {session?.writeError || state.error || currentActionError}
              </span>
              {session?.writeError &&
                engine.canReloadInstance(session.instance.id) && (
                  <Button
                    variant="outline"
                    onClick={() =>
                      run(() => engine.reloadInstance(session.instance.id))
                    }
                  >
                    重新加载并保留编辑
                  </Button>
                )}
            </div>
          )}
          {session ? (
            <RecordView
              key={id}
              engine={engine}
              {...recordProps}
              toolbarStart={toolbarStart}
            />
          ) : (
            <div className="fve:rounded-lg fve:border fve:border-dashed fve:p-10 fve:text-center fve:text-sm fve:text-muted-foreground">
              {state.instanceIds.length
                ? '请选择一个视图实例'
                : '暂无可用视图，请由宿主配置视图实例'}
            </div>
          )}
        </main>
      </div>
    </ViewExpansionContext.Provider>
  );
}
function ViewInstanceActions({
  engine,
  session,
  run,
}: {
  engine: ViewEngine;
  session: RecordSession;
  run(action: () => void | Promise<void>): void;
}) {
  const [open, setOpen] = useState(false);
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    if (!saved) return;
    const timer = setTimeout(() => setSaved(false), 2500);
    return () => clearTimeout(timer);
  }, [saved]);
  const primaryRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLButtonElement>(null);
  const dialogFocus = useRef<HTMLButtonElement>(null);
  const actionsRef = useRef<HTMLDivElement>(null);
  const restoreFocus = useRef(false);
  const permissions = engine.getPermissions(session.instance.id);
  const canSaveAs = permissions.saveAsPersonal || permissions.saveAsShared;
  const canRestore = session.dirty || session.filterPending;
  const writing = session.writeStatus !== 'idle';
  const blocked = writing || session.filterPending || session.requiresReload;
  const showSaved =
    saved && !session.dirty && !session.filterPending && !writing;
  // Move focus after React removes the restore-only menu and disables Save.
  useLayoutEffect(() => {
    if (restoreFocus.current && !canRestore) {
      restoreFocus.current = false;
      actionsRef.current?.focus();
    }
  }, [canRestore]);
  const restore = () => {
    restoreFocus.current = permissions.save && !canSaveAs;
    run(() => engine.restore(session.instance.id));
  };
  if (!permissions.save && !canSaveAs)
    return canRestore ? (
      <Button
        variant="ghost"
        size="sm"
        disabled={writing || session.requiresReload}
        onClick={restore}
      >
        <RotateCcwIcon data-icon="inline-start" aria-hidden="true" />
        还原
      </Button>
    ) : null;
  const hasMenu = (permissions.save && canSaveAs) || canRestore;
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DropdownMenu>
        <ButtonGroup ref={actionsRef} tabIndex={-1} aria-label="视图操作">
          <Button
            ref={primaryRef}
            variant="outline"
            size="sm"
            aria-label={permissions.save ? '保存' : '另存为'}
            disabled={blocked || (permissions.save && !session.dirty)}
            onClick={() => {
              if (permissions.save)
                run(async () => {
                  setSaved(false);
                  await engine.save(session.instance.id);
                  setSaved(true);
                });
              else {
                dialogFocus.current = primaryRef.current;
                setOpen(true);
              }
            }}
          >
            {showSaved ? (
              <CheckIcon data-icon="inline-start" aria-hidden="true" />
            ) : permissions.save ? (
              <SaveIcon data-icon="inline-start" aria-hidden="true" />
            ) : (
              <CopyIcon data-icon="inline-start" aria-hidden="true" />
            )}
            {session.writeStatus === 'deleting'
              ? '删除中…'
              : writing
                ? '保存中…'
                : showSaved
                  ? '已保存'
                  : permissions.save
                    ? '保存'
                    : '另存为'}
          </Button>

          {hasMenu && (
            <DropdownMenuTrigger
              render={
                <Button
                  ref={menuRef}
                  variant="outline"
                  size="icon-sm"
                  aria-label="视图选项"
                  disabled={writing || session.requiresReload}
                />
              }
            >
              <ChevronDownIcon aria-hidden="true" />
            </DropdownMenuTrigger>
          )}
        </ButtonGroup>
        <span role="status" aria-label="保存状态" className="fve:sr-only">
          {showSaved ? '视图已保存' : ''}
        </span>
        {hasMenu && (
          <DropdownMenuContent align="start" finalFocus={!open}>
            <DropdownMenuGroup>
              {permissions.save && canSaveAs && (
                <DropdownMenuItem
                  disabled={blocked}
                  onClick={() => {
                    dialogFocus.current = menuRef.current;
                    setOpen(true);
                  }}
                >
                  <CopyIcon aria-hidden="true" />
                  另存为
                </DropdownMenuItem>
              )}
              {permissions.save && canSaveAs && canRestore && (
                <DropdownMenuSeparator />
              )}
              {canRestore && (
                <DropdownMenuItem
                  disabled={writing || session.requiresReload}
                  onClick={restore}
                >
                  <RotateCcwIcon aria-hidden="true" />
                  还原
                </DropdownMenuItem>
              )}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        )}
      </DropdownMenu>
      <DialogContent finalFocus={dialogFocus}>
        <SaveAsForm
          engine={engine}
          session={session}
          onSaved={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
function SaveAsForm({
  engine,
  session,
  onSaved,
}: {
  engine: ViewEngine;
  session: RecordSession;
  onSaved(): void;
}) {
  const permissions = engine.getPermissions(session.instance.id);
  const [title, setTitle] = useState(`${session.instance.title} 副本`);
  const [scope, setScope] = useState('personal');
  const scopeId = useId();
  const [error, setError] = useState<string | null>(null);
  const writing = session.writeStatus !== 'idle';
  const choices = [
    {
      value: 'personal',
      label: '个人视图',
      description: '仅自己可见，适合保存个人常用配置。',
      disabled: !permissions.saveAsPersonal,
    },
    {
      value: 'shared',
      label: '公共视图',
      description: '对有访问权限的用户可见，适合团队共享。',
      disabled: !permissions.saveAsShared,
    },
  ];
  const target =
    (
      choices.find(item => item.value === scope && !item.disabled) ??
      choices.find(item => !item.disabled)
    )?.value ?? null;
  return (
    <form
      className="fve:flex fve:flex-col fve:gap-4"
      onSubmit={event => {
        event.preventDefault();
        if (!target) return;
        setError(null);
        const saveScope: SaveAsScope =
          target === 'personal'
            ? { type: 'personal' }
            : { type: 'public', source: 'shared' };
        void engine
          .saveAs(
            { title: title.trim(), scope: saveScope },
            session.instance.id,
          )
          .then(onSaved)
          .catch(error =>
            setError(error instanceof Error ? error.message : '另存为失败'),
          );
      }}
    >
      <DialogHeader>
        <DialogTitle>另存为视图</DialogTitle>
        <DialogDescription>
          保存当前已应用的配置，原视图保持原样。
        </DialogDescription>
      </DialogHeader>
      <label className="fve:flex fve:flex-col fve:gap-2 fve:text-sm">
        视图名称
        <Input
          aria-label="视图名称"
          autoFocus
          required
          value={title}
          onChange={event => setTitle(event.target.value)}
          disabled={writing}
        />
      </label>
      <fieldset className="fve:m-0 fve:min-w-0 fve:border-0 fve:p-0 fve:text-sm">
        <legend id={scopeId} className="fve:mb-3 fve:p-0 fve:font-medium">
          可见范围
        </legend>
        <RadioGroup
          aria-labelledby={scopeId}
          value={target}
          onValueChange={value => {
            if (value) setScope(value);
          }}
          disabled={writing}
          className="fve:gap-4"
        >
          {choices.map(choice => (
            <label
              key={choice.value}
              htmlFor={`${scopeId}-${choice.value}`}
              className={cn(
                'fve:flex fve:cursor-pointer fve:items-start fve:gap-3',
                (writing || choice.disabled) &&
                  'fve:cursor-not-allowed fve:opacity-50',
              )}
            >
              <RadioGroupItem
                id={`${scopeId}-${choice.value}`}
                value={choice.value}
                aria-labelledby={`${scopeId}-${choice.value}-label`}
                aria-describedby={`${scopeId}-${choice.value}-description`}
                disabled={choice.disabled}
                className="fve:mt-0.5"
              />
              <span className="fve:grid fve:gap-1">
                <span
                  id={`${scopeId}-${choice.value}-label`}
                  className="fve:font-medium"
                >
                  {choice.label}
                </span>
                <span
                  id={`${scopeId}-${choice.value}-description`}
                  className="fve:text-muted-foreground"
                >
                  {choice.description}
                  {choice.disabled && '（无创建权限）'}
                </span>
              </span>
            </label>
          ))}
        </RadioGroup>
      </fieldset>
      {error && (
        <p role="alert" className="fve:text-sm fve:text-destructive">
          {error}
        </p>
      )}
      <DialogFooter>
        <DialogClose render={<Button variant="outline" disabled={writing} />}>
          取消
        </DialogClose>
        <Button
          type="submit"
          disabled={
            writing ||
            !target ||
            !title.trim() ||
            session.filterPending ||
            session.requiresReload
          }
        >
          {writing ? '保存中…' : '创建视图'}
        </Button>
      </DialogFooter>
    </form>
  );
}
