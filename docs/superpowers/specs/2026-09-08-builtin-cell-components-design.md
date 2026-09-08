# View Engine 内置单元格设计

用户已确认本阶段六类组件与接入契约，现已实现并完成源码与浏览器验证。沿用当前任务内顺序实施；不新增依赖，不提交此前筛选器或本阶段改动，提交等待用户指令。

## 接入边界

独立导出 TextCell、TagsCell、StatusCell、LinkCell、DateTimeCell、NumberCell 及对应 props；内置名称分别为 text、tags、status、link、date-time、number。独立组件接收 value 和展示属性，不要求传入整个 ViewHost/引擎。内部适配器将已有 CellRendererProps 转交组件。

继续优先 column.renderer，其次 field.cellRenderer。显式 cells 自有注册项优先于内置注册，未知名称仍报告错误，原型属性不属于注册项。JSON 只保存 name/options，不保存函数、组件、路由器或请求服务。单元格展示与复制不触发查询、选择或 dirty 变化；现有渲染错误边界隔离单格错误。

## 六类组件

- TextCell：value 为原始值，可选 text 为展示文本；null/undefined/空字符串显示 —，0/false 有效。ellipsis 默认 false，开启时单行截断并提供可聚焦的完整内容提示；copyable 默认 false，复制原值的字符串表示，异步成功/失败反馈贴近按钮，拒绝或 Clipboard API 不可用不伪装成功。过期值的复制反馈不附着到新值。
- TagsCell：接受标量或数组，支持 string/有限 number/boolean；按类型去重，复用 field.options 的标签，未知值保留原文。默认最多展示 2 项，其余用可操作的数量按钮展开完整集合；maxVisible 是正整数。复用 Badge、Popover，标签不可编辑，不删除记录值。
- StatusCell：单值标签，状态名称来自 field.options，tone 为 neutral/success/warning/danger/info。options.tones 是带原始 value 的映射数组，保持 1 与 "1" 不同；只影响展示，文字始终存在。状态色使用主题语义变量，未知值使用中性样式与原始文本。
- LinkCell：value 是链接文字，默认也是地址；独立组件可传 href，配置适配器可用 hrefField 从当前记录读取地址。允许 HTTP(S)、mailto、tel 和相对地址，URL 解析后再次校验协议；危险或无效地址呈现普通文本。默认当前页，newTab 可选且强制 noopener noreferrer。领域路由、命令行为继续使用显式自定义组件。
- DateTimeCell：复用原有 date/datetime 展示语义，日期字符串 YYYY-MM-DD 保持日历日期，不经时区平移；时间戳 0 有效，无效日期显示占位。时区沿用 field.timeZone，options 允许 locale/dateStyle/timeStyle（full/long/medium/short）；日期时间默认为 medium。独立组件暴露 type/timeZone 便于直接使用。
- NumberCell：仅格式化有限 number，0 有效，错误数据占位；复用 formatRecordNumber。独立组件接收 format；内置组件始终读取 field.numberFormat，使金额、百分比、精度与汇总一致。百分比遵循原有 Intl 约定：0.125 显示 12.5%，不猜测单位或解析货币字符串。

命名内置 options 必须进行运行时验证；已识别属性类型错误、重复 tone 映射、无效字段路径等报告配置错误，不静默覆盖。基础未配置渲染行为继续保留，仅将共用格式化提取为内部纯函数，避免两套日期和文本逻辑。

## 复用和范围

复用现有 shadcn/Base UI Badge、Button、Tooltip、Popover、主题继承和错误边界；数字共用 formatRecordNumber，日期使用 Intl 与现有日期校验能力。viewer 的 Ant Design 单元格只作为使用习惯参考，不引入 Ant Design，也不复制其宽松金额解析或 URL 黑名单。

本阶段不实现图片/头像、进度、JSON 编辑、可编辑表格、表达式模板、业务路由或通用展示注册框架。保持 core 入口不加载 React。

## 验证

先以现有 RecordCell 的缺失内置渲染器行为建立失败测试，再验证六类组件、类型化枚举、未知值、0/false、原始值复制、拒绝复制、危险 URL/原型注册、日期及时区、数值与汇总一致。JSON 往返以及 LocalStorageViewHost 新实例恢复必须保留列 renderer/options。

通过公开入口建立内置单元格 Storybook 示例，分别覆盖常用组件、深色窄屏、异常数据、浏览器刷新恢复。检查键盘展开、Escape 返回焦点、长内容不撑列和弹层主题。完成受影响包双模式测试、类型检查、lint、构建、打包与 Storybook 浏览器验证；同步双语 README/API 参考。

## 自检

配置和运行时组件分离，未新增 host 职责；数字格式只有一个来源。正常空值与配置错误有不同表达，复制及标签弹层状态不持久化。六类组件分别有可验证行为，无占位需求。

## 实施结果

采用模块级静态内置注册表，保持 React Compiler 的静态组件要求。日期/文本共用格式化；标签与状态共用纯值标签处理，保留数字标识符原文。独立审查发现并关闭三项问题：URL 规范化前后协议不一致、超出支持精度的本地时间回退到宿主时区、非省略长文本挤出复制按钮。对应失败回归已转绿，状态反馈不进入持久化配置。
