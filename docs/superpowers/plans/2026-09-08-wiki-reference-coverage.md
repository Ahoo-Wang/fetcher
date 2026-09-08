# Wiki 重写覆盖与验收

基线：`e79535b96c94819229bb824dae4dc84333a127c6`。执行期间已 fetch origin/main，确认与当前 HEAD 一致。保留隔离工作树中的改动，未提交、推送或部署。

## 公开 API 覆盖

以 TypeScript checker 对各包根入口递归导出的具名符号核对；具体符号、专题锚点和源码链接在对应包索引内。类型声明与运行时行为分开说明。

| 包          | 具名公开符号 | 双语参考页 |
| ----------- | -----------: | ---------: |
| Fetcher     |           95 |         14 |
| Decorator   |           39 |          8 |
| EventBus    |           22 |          6 |
| EventStream |           25 |          8 |
| Storage     |           14 |          6 |
| OpenAPI     |           37 |          8 |
| Generator   |            2 |         12 |
| OpenAI      |           13 |          6 |
| CoSec       |           72 |          8 |
| React       |          138 |         18 |
| Wow         |          248 |         20 |
| Viewer      |          263 |         18 |
| 合计        |          968 |        132 |

全站保留 186 个双语页面及生成的 404 页。LLM 语料与 sitemap 对应当前页面。

## 实际验证

- `pnpm install --frozen-lockfile` 成功；未增加依赖或修改锁文件。
- `pnpm test:unit` 成功：3825 通过，1 跳过。Viewer 存在 jsdom 伪元素 getComputedStyle 警告。
- 相关包构建通过。基础包 16 个、协议/生成包 12 个、React/Wow/Viewer 25 个、Recipes 10 个、首页/学习页 8 个完整示例经过严格类型检查。
- Generator 对 demo、CQRS 和文档实际 JSON 输入真实生成，并编译生成代码及消费者。未把猜测的客户端名称当作示例。
- 示例类型检查采用现有包适用的 Bundler 模块解析。现有 dist 声明中的无扩展名重导出在 NodeNext 下存在解析限制；未以文档任务修改 SDK。
- `pnpm --dir wiki fix:mermaid`：4 个图表块，无损坏，无需自动修改。
- `pnpm --dir wiki build` 成功。保留构建已有的大 chunk 警告，未为消除提示修改打包架构。
- `node --test wiki/test/documentation.test.mjs`：双语元数据、LLM 全量覆盖、当前文档结构检查通过。
- `WIKI_TEST_URL=http://127.0.0.1:4173 node --test wiki/test/mermaid-browser.test.mjs`：正文宽度、对话框、焦点循环/恢复、Esc、普通滚轮与 Command 缩放通过。
- 生产预览验证：英中首页/参考/图表、搜索、语言对应页、深浅主题、桌面/390px移动端、图表错误源码回退、展开/关闭及跨路由清理通过。无正文横向溢出。
- 构建 HTML 页面扫描：内部 fragment 零断链、ID 零重复。
- `git diff --check` 通过。SDK、根 package.json、workspace catalog、锁文件无修改。

## 审阅修正

独立子代理审阅并复验后修正：类/单例和自动标题的锚点碰撞、Generator JSON 输入、Viewer datetime 注册键与分页大小受控问题、Mermaid 内联尺寸/全视口/工具栏/主题行为。

用户明确要求不考虑旧文档兼容性；已移除旧单页、旧章节链接、路由重写及对应兼容测试。

## 范围

此交付为当前工作树中的文档站重写与本地预览。没有修改 SDK 行为，没有调用真实身份服务或使用真实凭据，没有发布生产站点。
