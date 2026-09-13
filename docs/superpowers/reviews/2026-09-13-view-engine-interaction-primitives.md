# View Engine 第一阶段验证记录

设计：`docs/superpowers/specs/2026-09-13-view-engine-interaction-primitives-design.md`

基线：`022f1e69e33160b11e9431f00f1fee46b6b90c89`。用户选择当前会话顺序执行，另已批准仅补充三个依赖的 Vite external 匹配项。

## 错误边界阶段

状态：本地交付验收通过。

7 处自维护错误捕获/重置类已改为 react-error-boundary。两个编辑器生命周期类保留，错误恢复通知通过 RenderCommit 等待成功提交。

反例验证：

- 原实现转换器重试时，订阅者观测到无效输入短暂经历 `[true, false]`。新测试要求全程不出现 true；迁移后通过。
- resetKey 单值与只有一个相同元素的数组必须视为不同身份。简单展开会丢失这个区别；实现加入形状判别，回归通过。
- 新建 resetKeys 数组但元素不变不触发重试；无消息异常仍被隔离。
- 原扩展编辑器旧回调、持续失败、布局 lazy 失败重试与焦点恢复测试保留。

验证结果：源码定向 79 项、编译后定向 79 项通过；根全量单测通过，View Engine 源码/compiled 各 1645 项通过、3 项跳过；类型、lint 和依赖构建通过。Chrome Storybook 374 项通过。完整 Chromium verify:view-engine 通过，包括真实布局 chunk 故障、HTTP/IndexedDB 宿主、性能预算、浅色/深色 1440/390px axe 与生命周期检查。

发布包：463 个 dist 文件与工作树构建一致，11 个公开目标、2 个 core runtime 模块，归档 SHA-256 `00326f5d7f7c32174fd392e92bea8f9c3270f8af761d1f3727c3c1bb4dc0349c`。证据目录 `/tmp/fve-boundary-acceptance`。截图已检查，降级布局仍保留导航、数据和保存。

### 复杂度口径

统计基线至当前受影响的 `packages/view-engine/src/**/*.ts(x)`，包含新增 RenderCommit 与所有业务调用方。使用 TypeScript scanner 跳过 trivia，统计非空 token 所在物理行；注释、空行、测试、文档与生成代码不计。清单与结果保存在 `/tmp/fve-boundary-loc.json`，采集脚本 `/tmp/fve-interaction-loc.mjs`。

| 口径                 | 基线 | 当前 |
| -------------------- | ---: | ---: |
| 受影响生产源码行     | 1499 | 1466 |
| 自维护错误捕获状态机 |    7 |    0 |

净减少 33 行，约 2.2%。这不是全包代码量降幅，也不代表运行速度提升。依赖清单和锁文件增量另外审查，不用删除必要的有效性保护扩大该数字。

### 包体积口径

使用相同 Vite 版本，分别以 dist/index.js 和 dist/react.js 为独立全导出消费入口，开启生产压缩，排除 React/ReactDOM 宿主依赖，打包其余依赖，累计各 JS chunk 字节和各 chunk gzip 字节。该口径包含懒加载 chunk，是全部能力被消费的上界 fixture，不是首页首屏流量。

采集脚本 `/tmp/fve-interaction-measure.mjs`；基线产物 `/tmp/fve-interaction-before/measurement.json`。

| 入口  | 基线 JS 字节 | 基线 gzip 字节 |
| ----- | -----------: | -------------: |
| core  |       307738 |          76194 |
| React |      2436162 |         606023 |

| 入口  | 迁移后 JS 字节 | 迁移后 gzip 字节 | gzip 增量 |
| ----- | -------------: | ---------------: | --------: |
| core  |         307738 |            76194 |         0 |
| React |        2439468 |           607085 |     +1062 |

迁移后产物 `/tmp/fve-interaction-after-boundaries/measurement.json`。React 消费入口增加 1062 gzip 字节，包含通用错误边界与更完整的有效性恢复保护；core 未增长。性能按现有验收预算通过，不宣称加速；上述体积不等于首屏流量。

## 排序阶段

状态：尚未实施；须在错误边界阶段验收后开始。使用错误边界完成提交作为独立代码量基线，不混合两阶段收益。

## 证据边界

本轮不部署、不推送、不合并。真实触摸设备、真实读屏器和业务用户走查尚未执行；浏览器触摸模拟将单独记录。生产服务准入不由本地测试代替。
