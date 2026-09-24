# Storybook 维护约定

Storybook 是可运行的接入文档，也承载浏览器交互回归。导航按能力组织，代码按模块就近维护。

## 示例与回归

- `*.stories.tsx`：展示组件、初始参数、说明和可手动操作的场景。允许初始化读取和无副作用的渲染断言。
- `*.test.stories.tsx`：导入展示故事，复用参数和演示实现，安装复杂 `play`。使用 `['!dev', '!autodocs', 'test']`，保留测试执行并隐藏默认导航与文档入口。
- `*.play.ts`：较长交互需要单独成文件时的具名实现，就近维护（目前没有这样的文件，`play` 都写在孪生故事里）。不要求为简单断言单独建文件。
- `shared/`：只有真实复用的场景外壳（文档场景外壳 `ScenarioFrame`、迁出故事的占位 `MovedNotice`）和 Ant Design Provider。模块显式声明装饰器，不通过故事标题选择 Provider。

普通展示不能依赖自动测试来创建初始数据或完成异步请求。打开页面后，筛选、保存、创建和删除均由使用者触发。

## 文档与状态

`.storybook/DocsPage.tsx` 使用原生文档块展示一个主示例、参数和独立场景链接，避免将所有场景同时挂载。复杂包装器的代码面板引用真实接入源码。

修改全局 fetch 的示例使用独立 iframe，并通过 `beforeEach` 返回清理函数。共享夹具（`fixtures/http.ts`）的数据可以复用，可变状态不能跨场景共享。未知来源的请求交给原始 fetch；受控失败只作用于示例 API。

`http/`、`events/`、`react/`、`storage/` 与 `docs/` 的故事是接入文档，用 `ScenarioFrame`：标题、摘要、夹具与 Setup／Action／Observe 三格。

## 已迁出的故事

Wow 相关的包迁到了 [Wow 仓](https://github.com/Ahoo-Wang/Wow/tree/main/typescript)（迁移第 3′ 步），它们的故事也随之迁走，在 Wow 文档站的 [Storybook](https://wow.ahoo.me/storybook/) 里维护。`moved/` 为每个迁走的故事分组留一个占位页，旧链接落在去向说明上，而不是空页：

- `View Engine/已迁移`：数据视图引擎的全部场景，迁往 `@ahoo-wang/wow-view-engine`（View Engine 稳定后才发布到 npm）。
- `React Hooks/Wow Queries`：Wow 查询 Hook，迁往 `@ahoo-wang/wow-react`（随 Wow 的首个稳定版发布到 npm）。
- `Viewer/已退役`：`@ahoo-wang/fetcher-viewer` 没有迁移，冻结在 `5.x` 分支，故事也留在那里。

新包名在 npm 上还不存在，占位页只写迁往哪个包、什么时候发布，以及在那之前继续用 5.x 版本线（npm 上的 5.1.x，分支 `5.x`）。占位页目前链接到 Wow Storybook 的首页；等 Wow 那边的故事 id 稳定后再改成逐个故事的链接。

## 本地门禁

合并前在本机跑齐下面每一条，**每条单独看退出码**（`命令 > 日志 2>&1; echo "名字 exit $?"`），全部为 0 才算过——`pnpm test` 末尾还有一段 `test:type`，只 grep 测试摘要会漏掉它的失败。

**0. 先构建依赖（新 worktree 必做一次）。** `typecheck:stories` 对照各包 `dist/` 里的类型声明：

```bash
pnpm install
pnpm -r --filter './packages/*' build
```

仓库根的 `pnpm build`（`pnpm -r build`）还会构建 `wiki`，它的 `prebuild` 重写受版本控制的 `wiki/llms-full.txt`；这不是改动的一部分时用 `git checkout -- wiki/llms-full.txt` 还原再提交。

**1. 仓库根的故事门禁：**

```bash
pnpm lint:stories
pnpm typecheck:stories   # 对照第 0 步构建出的类型声明
PLAYWRIGHT_BROWSERS_PATH=$HOME/Library/Caches/ms-playwright-user pnpm test:storybook
```

`test:storybook` 在无头 Chromium 里跑每个故事的 `play`（`vitest.config.ts` 的 `storybook` 工程，`@vitest/browser-playwright`）。它要的 Chromium 版本跟随 `playwright` 的版本；默认缓存 `~/Library/Caches/ms-playwright` 可能是旧版本，也可能归 root 所有、装不进新版本，此时测试一启动就报找不到浏览器。办法是把 Chromium 装进一个自己拥有的目录，之后每次运行都用同一个 `PLAYWRIGHT_BROWSERS_PATH` 指向它：

```bash
PLAYWRIGHT_BROWSERS_PATH=$HOME/Library/Caches/ms-playwright-user pnpm exec playwright install chromium
```

机器同时跑多组测试时给 vitest 限并发，例如 `pnpm test:storybook --maxWorkers=3`；某个故事因超时失败，先单独重跑那一个文件再判断是不是真失败。

**2. 格式：** 对每个改动过的文件跑 `prettier --check`，失败时 `--write` 后再查一遍。仓库根没有 `prettier` 的可执行入口（它是各包的开发依赖，版本在 `pnpm-workspace.yaml` 的 catalog 里），在根目录直接用 pnpm 存储里的那份，路径里的版本号按 catalog 填：

```bash
git diff --name-only --diff-filter=d origin/main... | xargs node node_modules/.pnpm/prettier@3.9.9/node_modules/prettier/bin/prettier.cjs --check
```

**3. 静态 Storybook（改了导航、故事 id 或标签时）：**

```bash
pnpm build-storybook
```

`build-storybook` 包含静态索引检查：验证首页地址与回归标签。

先运行 `pnpm storybook`，再运行以下真实浏览器检查；使用独立的无头浏览器：

```bash
node scripts/verify-storybook-browser.mjs
```

文档浏览器检查也可接收服务地址：`node scripts/verify-storybook-browser.mjs http://127.0.0.1:6006`。

移动故事时同步检查首页、验证脚本和测试中的地址。历史迁移记录见 `docs/superpowers/plans/2026-09-08-storybook-migration.md`。
