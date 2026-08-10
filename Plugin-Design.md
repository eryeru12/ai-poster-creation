# Plugin Interaction & Runtime Design

## 0. Document Control

- Plugin ID：ai-poster-creation
- Design Version：0.3.0
- Status：DESIGN_READY
- Based on Spec：v0.3 / 2026-08-09
- Form：companion-web-app
- Required Target：claude-code
- UI Complexity：B
- Prototype Required：no（原 SPIKE-001 已验证画布拖拽交互；仪表盘和宣传图流程为标准组件组合，无新交互原语）
- Last Updated：2026-08-09

## 1. Design Summary

- 开发形态：companion-web-app，三阶段工作台——仪表盘首页（作品列表 + 新建入口）、海报制作（中置向导生成 + 左导航大画布编辑）、宣传图制作（中置向导上传→提示词→生成→审阅导出）
- 用户打开后看到：仪表盘首页——暖色渐变背景上的作品卡片网格，顶部"新建"按钮，首次使用展示空状态引导
- UI 负责：仪表盘作品列表与新建入口、模式选择浮层、海报全流程（生成阶段中置向导、编辑阶段左导航+画布+属性面板）、宣传图全流程（商品图上传预览、提示词输入、生成进度、结果审阅）
- Agent 负责：调用通义千问生成海报文案和宣传文案、调用通义万相生成海报底图（文生图）和商品宣传图（图生图）
- 结果写回：海报底图以卡片形式出现在版式选择网格中，宣传图在结果页展示大图预览和文案
- 权威状态：项目目录 `.ai-poster-creation/project.json`（海报项目）和 `.ai-poster-creation/promo-*.json`（宣传图项目）
- Required Host Path：Skill 启动本地 Express Web 服务，外部浏览器打开编辑器，MCP Server 通过 stdio 与宿主通信
- 最大设计风险：低——仪表盘为标准列表组件，宣传图为中置向导变体（复用海报生成阶段的布局骨架），图生图 API 需验证商品主体保持一致性

## 2. Requirement Coverage

| Requirement ID | Design Section | Decision / Component | Status |
|---|---|---|---|
| REQ-001 | 7 / 8 | generate_copy Tool + Qwen API | covered |
| REQ-002 | 7 / 8 | generate_poster_images Tool + Wanxiang API（文生图） | covered |
| REQ-003 | 7 / 8 | generate_poster_images referenceImage 参数 | covered |
| REQ-004 | 5 / 6 | CanvasPanel 文字元素按版式 constraintZone 定位 | covered |
| REQ-005 | 5 / 6 | CanvasPanel 拖拽 + PropertiesPanel 属性修改 | covered |
| REQ-006 | 5 / 7 | export_poster Tool + Toolbar 导出按钮 | covered |
| REQ-007 | 9 | project_state Tool + auto-save | covered |
| REQ-008 | 4 / 7 / 8 | generate_promo_image Tool + Wanxiang API（图生图）+ PromoCreator 组件 | covered |
| REQ-009 | 4 / 5 / 9 | Dashboard 组件 + list_projects Tool + 模式选择浮层 | covered |
| UX-001 | 5 / 13 | ProgressBar 组件 + SSE 推送（海报和宣传图复用） | covered |
| UX-002 Rev2 | 4 / 5 | 生成阶段 LayoutGrid 卡片网格 + 放大预览 | covered |
| UX-003 Rev2 | 4 / 5 | 右侧 PropertiesPanel Tab式属性/样式面板 + 左侧 CopyPanel 管内容 | covered |
| UX-004 Rev2 | 5 | CanvasPanel 8控制点拖拽 + 蓝色选中边框 | covered |
| UX-005 | 4 / 5 | App.tsx 两阶段状态机（generation / editing） | covered |
| UX-006 | 4 / 5 | LeftNav 80px 图标栏 + ExpandPanel 328px 滑入面板 | covered |
| UX-007 | 12 | warm-playful 自定义视觉主题 | covered |
| UX-008 | 4 / 5 | Dashboard 作品卡片网格 + 空状态引导 + 模式选择浮层 | covered |
| UX-009 | 4 / 5 / 7 | PromoCreator 中置向导（上传→提示词→进度→结果） | covered |
| HOST-001 | 10 | claude-code-browser Profile（Skill 启动 + 浏览器打开） | covered |
| HOST-002 | 7 | MCP Server stdio transport + 7 Tool（新增 generate_promo_image + list_projects） | covered |
| DATA-001 | 9 | .ai-poster-creation/ 项目 JSON 文件 | covered |
| DATA-002 | 9 | .ai-poster-creation/uploads/ 参考图存储 | covered |
| DATA-003 | 9 | .ai-poster-creation/exports/ 导出文件 | covered |
| DATA-004 | 9 | .ai-poster-creation/uploads/ 商品图存储（复用 uploads 目录） | covered |
| SEC-001 | 11 | SecurityService + DASHSCOPE_API_KEY 环境变量 | covered |
| SEC-002 Rev3 | 11 | 网络白名单扩展：dashscope.aliyuncs.com + cn-beijing.maas.aliyuncs.com | covered |
| SEC-003 | 11 | 路径边界检查仅项目目录 | covered |
| NFR-001~004 | 7 / 9 | 超时设置 + 导出分辨率 | covered |
| NFR-005 | 7 | 宣传图单张 <30s，generate_promo_image 超时 30s | covered |
| AC-001~AC-011 | 15 | 场景走查映射 | covered |

## 3. Decision Register

### DEC-001 · 两阶段模式切换

- Type：user
- Decision：生成阶段中置向导 + 编辑阶段左导航大画布右属性，两个阶段不共享面板布局
- Alternatives：A（仅换视觉保留三栏）、B（fast-poster 完整布局 + AI 流程适配）、C（混合——当前选择）
- Rationale：用户明确选择 C；生成阶段的输入/进度/版式选择是线性流程，中置向导减少视觉噪音；编辑阶段需要最大化画布空间，左导航折叠模式满足此需求
- Trade-off：两阶段间切换有上下文转换成本，但符合用户的"先聚焦生成、再专注编辑"心智模型
- Related IDs：UX-005, UX-006, UX-002 Rev2
- Source / Verified At：用户确认 / 2026-08-09
- Status：active

### DEC-002 · warm-playful 自定义视觉主题

- Type：user（方向）+ architect（具体 token）
- Decision：基于暖色系（珊瑚橙 #FF6B6B → #FF8E53 渐变）、大圆角（12-16px）、毛玻璃面板、柔和阴影，建立自定义 visual kit
- Alternatives：neural-pro「极光」（暗色工作台，不适合"轻快"定位）、ink-on-paper「纸墨」（当前方案，被用户否定）
- Rationale：Harness 内置两套风格均不匹配用户需求；warm-playful 作为自定义 kit 写入 ui.kit
- Trade-off：自定义主题需手动维护 tokens.css/components.css，但完全匹配用户"活泼轻快"目标
- Related IDs：UX-007
- Source / Verified At：用户确认方向 + Architect 决定具体 token / 2026-08-09
- Status：active

### DEC-003 · 左侧扩展面板内容分工

- Type：user
- Decision：左侧扩展面板管文案内容编辑（CopyPanel），右侧属性面板管选中文字样式（PropertiesPanel Tab式）
- Alternatives：全部放右侧（左侧只留版式列表）、全部放左侧（右侧取消）
- Rationale：用户明确"左侧文案面板管内容，右侧属性面板管样式"；内容编辑和视觉调整的分离符合"文字写了什么 → 文字长什么样"的自然思维
- Trade-off：编辑一个文字元素需要在左右两侧之间切换，但内容/样式分离减少了单个面板的认知负担
- Related IDs：UX-003 Rev2, UX-006
- Source / Verified At：用户确认 / 2026-08-09
- Status：active

### DEC-004 · 画布控制点交互（来自 SPIKE-001）

- Type：architect
- Decision：文字元素使用 8 控制点（四角 + 四边中点）拖拽调整区域，选中显示蓝色边框（#6CCFFF），拖拽限制在版式 constraintZone 内
- Alternatives：Fabric.js 全功能画布库（过重）、纯 CSS 定位（SPIKE-001 验证通过）
- Rationale：SPIKE-001 证明 DOM + CSS 定位方案满足 <100ms 交互延迟要求，不需要引入重型 Canvas 库
- Trade-off：不支持旋转和自由缩放，但首版仅需平移和区域调整
- Related IDs：UX-004 Rev2, DEC-005（来自 v0.1，保留）
- Source / Verified At：SPIKE-001 / evidence/design/spike-001/result.json
- Status：active

### DEC-005 · 左侧导航图标集合

- Type：architect
- Decision：4 个图标按钮——🖼 版式（poster list）、📝 文案（copy content edit）、📑 图层（text element list）、📤 导出（export shortcut）
- Alternatives：fast-poster 的模板/组件/图层/代码（不适配 AI 生成流程）
- Rationale：覆盖编辑阶段全部高频操作；导出作为快捷入口减少到顶部工具栏的鼠标移动距离
- Trade-off：图层功能在首版较简单（只有5个文字元素），但保留结构便于扩展
- Related IDs：UX-006
- Source / Verified At：Architect 决定 / 2026-08-09
- Status：active

### DEC-006 · 顶部工具栏设计

- Type：architect
- Decision：编辑阶段顶部固定工具栏，左侧放保存/撤销/重做，右侧放导出 PNG/导出 JPG；生成阶段精简顶部仅 Logo；仪表盘阶段顶部放标题 + 新建按钮
- Alternatives：浮动工具栏（fast-poster 风格，但增加实现复杂度）、无工具栏（全部放面板）
- Rationale：高频操作（保存/导出/新建）应在全局可及位置，不需要展开面板
- Trade-off：占用 56px 垂直空间，但换来了操作的确定性
- Related IDs：REQ-006, UX-004 Rev2, UX-008
- Source / Verified At：Architect 决定 / 2026-08-09
- Status：active

### DEC-007 · 仪表盘首页设计

- Type：user
- Decision：打开插件首先展示仪表盘首页——作品以暖色圆角卡片网格展示（海报和宣传图混合，通过类型标签区分），顶部"新建"按钮 → 弹出模式选择浮层（海报制作 / 宣传图制作两个大卡片选项），首次使用展示空状态引导
- Alternatives：A. 侧边栏导航（始终可见，但占用编辑空间）、B. Tab 切换（仪表盘/海报/宣传图三个 Tab，但层次感弱）、C. 首页仪表盘（当前选择）
- Rationale：用户明确"打开插件先看到作品列表页"；仪表盘作为统一入口让用户在创作前看到已有作品，降低"从头开始"的认知负担；模式选择浮层清晰区隔两种创作路径
- Trade-off：多了一层导航（仪表盘 → 选择模式 → 创作），但增加的步骤换来了清晰的心理模型和可扩展性
- Related IDs：REQ-009, UX-008
- Source / Verified At：用户确认 / 2026-08-09
- Status：active

### DEC-008 · 宣传图无需编辑

- Type：user
- Decision：商品宣传图生成后直接审阅导出，不提供画布编辑功能。用户可在结果页查看大图预览和宣传文案，选择导出或重新生成
- Alternatives：A. 生成的宣传图也进入编辑阶段（增加复杂度但统一体验）、B. 仅生成图片不含文案（丢失用户价值）、C. 生成后审阅导出（当前选择）
- Rationale：用户明确"宣传图不用编辑"；宣传图的 AI 输出是完整成品（商品融入场景 + 宣传文字已合成），用户只需确认效果和导出；这降低了宣传图流程的实现复杂度和用户操作步骤
- Trade-off：如果 AI 生成的宣传图有瑕疵（如文字渲染不完美），用户无法微调只能重新生成，依赖 AI 的一次性输出质量
- Related IDs：REQ-008, UX-009
- Source / Verified At：用户确认 / 2026-08-09
- Status：active

### DEC-009 · 宣传图使用通义万相图生图

- Type：architect
- Decision：商品宣传图调用通义万相 wan2.7-image-pro 图生图 API（与海报的文生图是同一模型的不同能力），以商品图作为输入参考 + 提示词描述期望场景和风格，生成包含商品和营销文案的完整宣传图
- Alternatives：A. 先抠图再背景替换（两阶段，增加延迟和复杂度）、B. 使用其他图生图 API（增加外部依赖）
- Rationale：通义万相 wan2.7-image-pro 原生支持 mixed content input（image + text prompt），一条 API 请求完成图生图；与海报使用同一 API 体系（DashScope），不需要新的 Key 或域名；API 支持 seed 锁定保证批量一致性
- Trade-off：图生图模式下不支持 4K 分辨率（仅 1K/2K），但宣传图的典型分辨率需求（1200-2000px）在覆盖范围内
- Related IDs：REQ-008, UX-009, NFR-005
- Source / Verified At：阿里云官方文档 / 2026-08-09
- Status：active

### DEC-010 · 作品列表数据源

- Type：architect
- Decision：仪表盘从 `.ai-poster-creation/` 目录扫描所有 `project.json` 和 `promo-*.json` 文件汇总作品列表，通过 `list_projects` MCP Tool 返回摘要信息（projectId、type、title、thumbnailPath、createdAt、updatedAt），不加载完整项目数据
- Alternatives：A. 维护中心索引文件（增加一致性维护成本）、B. 每次全量扫描+解析（小规模可行，项目多了可迁移到索引方案）
- Rationale：首版项目数量有限（<50），目录扫描+摘要提取性能可接受；海报和宣传图使用不同文件名模式区分类型，简单可靠
- Trade-off：项目数量增长后扫描性能会下降，但首版规模下不构成问题
- Related IDs：REQ-009, UX-008, DATA-001
- Source / Verified At：Architect 决定 / 2026-08-09
- Status：active

## 4. Experience Architecture

### UI Complexity and Prototype

- Class：B
- Reasons：多区工作台、三阶段切换、画布直接操作（拖拽/控制点）、属性面板、历史状态、仪表盘列表
- Prototype Scope：none required——原 SPIKE-001 已验证画布拖拽交互；仪表盘和宣传图流程为标准 UI 组件组合（卡片网格、文件上传、中置表单），无新增交互原语
- Highest-risk Assumptions：
  1. warm-playful 视觉在长时间编辑下的舒适度（需实际使用反馈，不阻塞首版）
  2. 通义万相图生图对商品主体保持的一致性（需 Design 后 Probe 验证）
- Evidence：evidence/design/spike-001/result.json（画布交互 PASS）

### Workspace Map

**仪表盘首页（appPhase = "dashboard"）：**

```text
┌──────────────────────────────────────────────────────────┐
│  Top Bar (56px)                                          │
│  [🍊 AI 海报生成器]                         [最小化按钮]  │
├──────────────────────────────────────────────────────────┤
│                                                          │
│              暖色渐变背景（#FFF5F0 → #FFE8D6）            │
│              浮动装饰形状（圆/椭圆/波浪）                  │
│                                                          │
│     ┌──────────────────────────────────────────────┐     │
│     │  📊 我的作品                    [+ 新建创作]  │     │
│     │  (醒目的暖色主按钮，圆角 12px)                │     │
│     ├──────────────────────────────────────────────┤     │
│     │                                              │     │
│     │  ┌─────────┐  ┌─────────┐  ┌─────────┐     │     │
│     │  │ 🎨 海报  │  │ 📦 宣传图│  │ 🎨 海报  │     │     │
│     │  │ 双十一   │  │ 保温杯   │  │ 端午     │     │     │
│     │  │ 08-09   │  │ 08-09   │  │ 08-08   │     │     │
│     │  └─────────┘  └─────────┘  └─────────┘     │     │
│     │                                              │     │
│     │  ┌─────────┐  ┌─────────┐                   │     │
│     │  │ 📦 宣传图│  │ 🎨 海报  │                   │     │
│     │  │ 数据线   │  │ 618    │                   │     │
│     │  │ 08-07   │  │ 08-06   │                   │     │
│     │  └─────────┘  └─────────┘                   │     │
│     │                                              │     │
│     └──────────────────────────────────────────────┘     │
│                                                          │
│     [空状态]:                                             │
│     ┌──────────────────────────────────────────────┐     │
│     │         🎨                                      │     │
│     │     还没有作品                                   │     │
│     │     创建你的第一张海报或商品宣传图                 │     │
│     │     [+ 新建创作]                                 │     │
│     └──────────────────────────────────────────────┘     │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

**模式选择浮层（点击"新建创作"后弹出）：**

```text
┌──────────────────────────────────────┐
│  ┌──────────────────────────────┐    │
│  │      选择创作类型      ✕     │    │
│  ├──────────────────────────────┤    │
│  │                              │    │
│  │  ┌──────────────────┐        │    │
│  │  │       🎨          │        │    │
│  │  │   海报制作         │        │    │
│  │  │   AI生成8种版式    │        │    │
│  │  │   在线编辑微调     │        │    │
│  │  │   文案精准嵌入     │        │    │
│  │  └──────────────────┘        │    │
│  │                              │    │
│  │  ┌──────────────────┐        │    │
│  │  │       📦          │        │    │
│  │  │   宣传图制作       │        │    │
│  │  │   上传商品图片     │        │    │
│  │  │   AI生成宣传图     │        │    │
│  │  │   自动输出文案     │        │    │
│  │  └──────────────────┘        │    │
│  │                              │    │
│  └──────────────────────────────┘    │
└──────────────────────────────────────┘
```

**海报生成阶段（appPhase = "poster", posterPhase = "generation"）：**

同 v0.2 Design §4 Workspace Map 生成阶段布局（中置向导输入 → 进度 → 版式卡片网格）。

**海报编辑阶段（appPhase = "poster", posterPhase = "editing"）：**

同 v0.2 Design §4 Workspace Map 编辑阶段布局（左导航 + 画布 + 右属性面板）。

**宣传图制作流程（appPhase = "promo"）：**

```text
┌──────────────────────────────────────────────────────────┐
│  Top Bar (56px)                                          │
│  [← 返回仪表盘]                                          │
├──────────────────────────────────────────────────────────┤
│                                                          │
│              暖色渐变背景（#FFF5F0 → #FFE8D6）            │
│              浮动装饰形状                                  │
│                                                          │
│  输入阶段：                                               │
│                    ┌──────────────────┐                  │
│                    │  📦 商品宣传图    │                  │
│                    │                  │                  │
│                    │  📤 上传商品图片  │                  │
│                    │  ┌──────────────┐│                  │
│                    │  │  拖拽或点击   ││                  │
│                    │  │  上传商品图   ││                  │
│                    │  │  PNG/JPG/WEBP ││                  │
│                    │  └──────────────┘│                  │
│                    │  [已上传: 预览图] │                  │
│                    │                  │                  │
│                    │  ✏️ 商品特色描述  │                  │
│                    │  ┌──────────────┐│                  │
│                    │  │ 描述商品特色  ││                  │
│                    │  │ 和期望的宣传图 ││                  │
│                    │  │ 风格...      ││                  │
│                    │  └──────────────┘│                  │
│                    │                  │                  │
│                    │  [✨ 生成宣传图]  │                  │
│                    └──────────────────┘                  │
│                                                          │
│  进度阶段（生成中）：                                      │
│                    ┌──────────────────┐                  │
│                    │  正在生成宣传图... │                  │
│                    │  ██████████░░░    │                  │
│                    │  [取消生成]       │                  │
│                    └──────────────────┘                  │
│                                                          │
│  结果阶段（生成完成）：                                    │
│                    ┌──────────────────┐                  │
│                    │  ✅ 生成完成      │                  │
│                    │  ┌──────────────┐│                  │
│                    │  │              ││                  │
│                    │  │  宣传图大图   ││                  │
│                    │  │  (最大宽度    ││                  │
│                    │  │   600px)     ││                  │
│                    │  │              ││                  │
│                    │  └──────────────┘│                  │
│                    │                  │                  │
│                    │  📝 宣传文案      │                  │
│                    │  "商品特色描述..." │                  │
│                    │                  │                  │
│                    │  [🔄 重新生成]    │                  │
│                    │  [📤 导出 PNG]   │                  │
│                    │  [📤 导出 JPG]   │                  │
│                    └──────────────────┘                  │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### Opening and Empty State

- Open Entry：用户在 Claude Code 中描述海报或宣传图需求 → Agent 调用 `open_poster_editor` Tool → 浏览器打开编辑器
- Initial Context：仪表盘首页（appPhase = "dashboard"），加载作品列表；如 URL 参数带有 projectId，直接跳转到对应项目（海报编辑阶段或宣传图结果页）
- Empty State（无作品）：中置引导插画 + "还没有作品" + "创建你的第一张海报或商品宣传图" + [+ 新建创作] 按钮
- Primary CTA：仪表盘顶部 [+ 新建创作] 按钮 → 弹出模式选择浮层
- Missing Context：projectId 存在但项目文件缺失时，提示"项目未找到"并返回仪表盘

### Core Objects

| Object | Identity | Parent / Relation | User-visible State | Persisted |
|---|---|---|---|---|
| Project (海报) | projectId (UUID) | root | type: "poster", title, appPhase, posterPhase, timestamps | yes (.ai-poster-creation/project.json) |
| PromoProject (宣传图) | promoId (UUID) | root | type: "promo", title, productImagePath, prompt, status, timestamps | yes (.ai-poster-creation/promo-{promoId}.json) |
| DashboardItem | projectId or promoId | root (summary) | type, title, thumbnailPath, createdAt, updatedAt | no（从持久化文件汇总） |
| PosterRequest | requestId | Project | theme, scene, style, size, referenceImagePath | yes |
| PromoRequest | requestId | PromoProject | productImagePath, prompt, size | yes |
| CopyContent | embedded in project | Project (poster) | mainTitle, subTitle, hookLine, activityInfo, footerNote | yes |
| PromoCopyContent | embedded in promo project | PromoProject | promoTitle, promoDescription, promoHighlights[] | yes |
| GeneratedImage | layoutId | Project | imagePath, status (queued/running/succeeded/failed) | yes (path ref) |
| PromoImage | single per PromoProject | PromoProject | imagePath, status (queued/running/succeeded/failed) | yes (path ref) |
| TextElement | elementId (layoutId-fieldKey) | Project + selectedLayout | text, x, y, width, height, fontSize, fontFamily, color, textAlign, lineHeight | yes |
| ExportResult | exportId | Project or PromoProject | filePath, format, width, height, createdAt | yes (path ref) |
| Job | jobId | Project or PromoProject | status, progress, total, images[], cancelled | no (ephemeral, recoverable) |

## 5. Direct Interaction Grammar

### Action Map

**仪表盘首页：**

| User Action | Target | Local UI Result | Save | Trigger Agent | Undo / Conflict |
|---|---|---|---|---|---|
| 打开编辑器（无 projectId） | — | 仪表盘首页 + 加载作品列表 | no | yes（list_projects） | N/A |
| 点击 [+ 新建创作] | 按钮 | 弹出模式选择浮层（毛玻璃遮罩） | no | no | 点击遮罩或 ✕ 关闭 |
| 点击"海报制作"卡片 | 模式选择浮层 | 关闭浮层，跳转到海报生成阶段 | no | no | N/A |
| 点击"宣传图制作"卡片 | 模式选择浮层 | 关闭浮层，跳转到宣传图输入阶段 | no | no | N/A |
| 点击作品卡片 | DashboardItem | 跳转到对应阶段（海报编辑 / 宣传图结果） | no | no | N/A |
| 双击或右键作品卡片 | DashboardItem | （首版不做，Backlog：重命名/删除） | — | — | — |

**海报制作流程：**

同 v0.2 Design §5 Action Map（生成阶段 + 编辑阶段全部操作）。

**宣传图制作流程：**

| User Action | Target | Local UI Result | Save | Trigger Agent | Undo / Conflict |
|---|---|---|---|---|---|
| 上传商品图（拖拽/点击） | 上传区 | 缩略图预览（280x280，圆角 12px），替换已有图片 | no | no | 可重新上传替换 |
| 输入提示词 | 文本框 | 即时字符显示，字数统计 | no | no | 浏览器默认 undo |
| 点击 [✨ 生成宣传图] | 表单提交 | 校验（必须有图片+提示词）→ 切换到进度阶段 | yes（输入内容） | yes（generate_promo_image） | N/A |
| 点击 [取消生成] | 进行中的 Job | Job 取消，已输入内容保留 | no | no | 不可撤销取消 |
| 结果页审阅 | 宣传图大图 + 文案 | 查看生成结果 | — | no | N/A |
| 点击 [🔄 重新生成] | 结果页按钮 | 返回输入阶段，保留原图片和提示词 | no | no | 可反复重试 |
| 点击 [📤 导出 PNG/JPG] | 结果页按钮 | 触发下载 | no（无额外保存） | no | 可重复导出 |
| 点击 [← 返回仪表盘] | Top Bar 按钮 | 保存当前状态，返回仪表盘首页 | yes（auto-save） | no | N/A |

### Selection and Focus

同 v0.2 Design §5 Selection and Focus（海报编辑阶段选中/焦点逻辑不变）。

宣传图流程无选中交互（线性表单流程）。

仪表盘作品卡片支持悬停高亮（放大 1.02x + 阴影增强，200ms ease），点击跳转。

### History and Recovery

同 v0.2 Design §5 History and Recovery（海报编辑阶段撤销/重做/自动保存/恢复逻辑不变）。

- 仪表盘无撤销需求（只读视图）。
- 宣传图流程无撤销需求（线性生成流程，重新生成即覆盖上一版本结果）。
- 恢复：刷新后根据 URL 参数或 projectId/promoId 恢复对应阶段；无参数时回到仪表盘首页。

## 6. UI ↔ Agent Contract

### Trigger Model

- Poster Primary Trigger：[✨ 开始生成] 按钮 → POST /api/generate/copy + /api/generate/images
- Promo Primary Trigger：[✨ 生成宣传图] 按钮 → POST /api/generate/promo
- Secondary Trigger：Agent 通过 MCP Tool 直接调用（generate_copy / generate_poster_images / generate_promo_image）
- Submit Boundary：输入表单填写完毕、用户点击按钮时意图完整
- Duplicate Protection：requestId 唯一，重复请求返回缓存结果
- User Preview：生成阶段进度条实时显示完成状态

### Request Contract（海报）

同 v0.2 Design §6 Request Contract。

### Request Contract（宣传图）

```json
{
  "requestId": "req-<uuid>",
  "operation": "generate_promo_image",
  "projectId": "promo-<uuid>",
  "projectVersion": 1,
  "userIntent": "保温杯在温暖咖啡场景中的宣传图",
  "params": {
    "productImagePath": ".ai-poster-creation/uploads/product-1694500000000.png",
    "prompt": "将这款保温杯放在温暖的咖啡店场景中，木质桌面，柔和灯光，突出保温杯的不锈钢质感和优雅外形",
    "size": { "width": 2048, "height": 2048 }
  },
  "createdAt": "2026-08-09T12:00:00Z"
}
```

### Agent Responsibilities

| Operation | Agent Reads | Agent Uses | Agent Must Return | Non-goal |
|---|---|---|---|---|
| generate_copy | params.theme, .scene, .style | Qwen API | structured CopyContent 对象 | 不生成图像 |
| generate_poster_images | params.style, .size, .referenceImage | Wanxiang API（文生图） | jobId + 8张底图 via SSE | 不处理文字 |
| generate_promo_image | params.productImagePath, .prompt | Wanxiang API（图生图 wan2.7-image-pro） | jobId + 宣传图 via SSE + 宣传文案 via Qwen API | 不提供编辑 |
| list_projects | projectDir（.ai-poster-creation/） | 文件系统扫描 | DashboardItem[] | 不加载完整项目 |
| project_state (load/save) | projectId + data | 文件系统 | ProjectState（海报）/ PromoProjectState（宣传图） | 不修改状态 |
| export_poster | projectId + posterId + format | 文件系统 + Canvas API | 文件路径 | 不修改项目状态 |

### Result Contract（宣传图）

```json
{
  "requestId": "req-<uuid>",
  "basedOnProjectVersion": 1,
  "status": "succeeded",
  "promoImage": {
    "imagePath": ".ai-poster-creation/cache/promo_img_001.png",
    "width": 2048,
    "height": 2048
  },
  "promoCopy": {
    "promoTitle": "温暖时光·品质随行",
    "promoDescription": "采用316不锈钢内胆，12小时持久保温。简约北欧设计，让每一口都温暖如初。",
    "promoHighlights": ["12小时保温", "316不锈钢", "北欧设计", "防漏杯盖"]
  },
  "warnings": [],
  "createdAt": "2026-08-09T12:00:25Z"
}
```

- Schema：contracts/promo-result.schema.json（新增）
- Default Application：auto——宣传图立即显示在结果页，文案显示在结果页下方
- Destructive Exception：无破坏性操作
- Original Preservation：重新生成创建新 version，覆盖前保留上一版本在 history 中
- Stale Result：不适用（宣传图为一次性生成，无并发编辑场景）
- User Confirmation：不适用——用户看到结果后自行决定导出或重新生成

## 7. MCP Catalog

### Render Tool

| Name | Purpose | Input | Output | Annotations | Resource |
|---|---|---|---|---|---|
| open_poster_editor | 启动 Web 编辑器并在浏览器中打开 | projectId (optional string) | { url, projectId } | readOnly, idempotent | none |

### App-only Tools

| Name | Purpose | Input / Output | Side Effect | Idempotency | Permission |
|---|---|---|---|---|---|
| project_state | 加载/保存海报项目状态 | action: load\|save, projectId, data? → ProjectState | 文件写入（save 时） | load 幂等，save 每次递增版本 | 项目目录 |
| promo_project_state | 加载/保存宣传图项目状态 | action: load\|save, promoId, data? → PromoProjectState | 文件写入（save 时） | load 幂等，save 每次递增版本 | 项目目录 |
| list_projects | 列出所有作品摘要 | 无输入 → { items: DashboardItem[] } | 无 | 幂等 | 项目目录 |
| export_poster | 导出海报/宣传图为 PNG/JPG | projectId, format, imageData? → { filePath } | 写入文件到 exports/ | 同名覆盖 | 项目目录 |

### Agent-visible Tools

| Name | Domain Operation | Input / Output | Version / Request | Error | Related IDs |
|---|---|---|---|---|---|
| generate_copy | 调用通义千问生成结构化海报文案 | requestId, params{theme,scene,style} → CopyContent | requestId 幂等缓存 | EXTERNAL_SERVICE_FAILED, INVALID_INPUT | REQ-001, AC-001 |
| generate_poster_images | 调用通义万相文生图生成 8 种版式底图 | requestId, params{style,size,referenceImage?} → { jobId, status } | requestId 幂等缓存，status: queued | EXTERNAL_SERVICE_FAILED, INVALID_INPUT | REQ-002, REQ-003, AC-001 |
| generate_promo_image | 调用通义万相图生图 + 通义千问文案，生成商品宣传图 | requestId, params{productImagePath,prompt,size?} → { jobId, status } | requestId 幂等缓存，status: queued | EXTERNAL_SERVICE_FAILED, INVALID_INPUT, MISSING_IMAGE | REQ-008, AC-010 |

### Long-running Tools

| Name | Stage | Job State | Cancel / Retry | Output |
|---|---|---|---|---|
| generate_poster_images | start | queued → running → succeeded / failed / cancelled | cancel 取消全部未完成任务；retry 用新 requestId | jobId |
| generate_promo_image | start | queued → running → succeeded / failed / cancelled | cancel 取消；retry 用新 requestId | jobId |
| _get_job_status (internal API) | status | 返回 progress, result | N/A | JobStatus |
| _cancel_job (internal API) | cancel | cancelled | N/A | { status: "cancelled" } |

### Resources

无 `ui://` Resource——form = companion-web-app，UI 通过 localhost HTTP 提供，不依赖 MCP Resource 机制。

## 8. Skill Catalog

| Skill | 触发描述要点（引用用户原话短语） | 覆盖 REQ / UX | 教 Agent 的工具流 | 负例来源 |
|---|---|---|---|---|
| generate-poster | 用户要"生成海报""做海报""设计海报""创建海报""制作宣传图""生成活动海报" | REQ-001~003, REQ-007 | open_poster_editor → 引导用户填写 → generate_copy → generate_poster_images → 用户选择编辑 → project_state(save) | "修改文字颜色""导出图片"（不是生成任务） |
| edit-poster | 用户要"改文字""调字体""换颜色""改大小""挪位置""调整海报" | REQ-004, REQ-005, UX-004 | open_poster_editor(projectId) → 用户在编辑器中自行操作 → project_state(save) | "重新生成海报"（应触发 generate-poster） |
| export-poster | 用户要"导出海报""下载海报""保存图片""输出 JPG""导出 PNG" | REQ-006, AC-004 | export_poster(projectId, posterId, format) → 返回文件路径 → 用户获得高清图片 | "生成海报"（应触发 generate-poster） |
| generate-promo | 用户要"生成宣传图""做商品图""做产品宣传图""给商品做图""商品宣传""产品海报" | REQ-008, UX-009 | open_poster_editor → 引导用户在仪表盘选"宣传图制作" → 上传商品图+填提示词 → generate_promo_image → 用户审阅导出 | "做促销海报"（应触发 generate-poster） |

- 启动技能：generate-poster——打开工作区并教 Agent 完整工具流（open → 仪表盘 → 选择海报 → 输入 → copy → images → save）
- 一个技能只管一件事，无悬空 agent 侧 REQ
- generate-promo 替代 generate-poster 处理用户描述中的商品图需求；Agent 根据用户原话中的商品图/产品图/商品宣传等关键词路由
- Codex target：无需额外配置（当前仅 claude-code required）

## 9. State, Files and Jobs

### State Layers

| Layer | Authority | Contents | Persistence | Writer | Conflict Rule |
|---|---|---|---|---|---|
| Authority State (海报) | .ai-poster-creation/project.json | Project 完整状态 | JSON 文件，原子写（tmp + rename） | project_state Tool (save) / UI API | last-write-wins，projectVersion 自增 |
| Authority State (宣传图) | .ai-poster-creation/promo-{promoId}.json | PromoProject 完整状态 | JSON 文件，原子写（tmp + rename） | promo_project_state Tool (save) / UI API | last-write-wins，projectVersion 自增 |
| Dashboard Summary | 内存 | DashboardItem[]（从项目文件汇总） | none（运行时） | list_projects Tool | 每次访问重新扫描 |
| UI Ephemeral | React state | 当前选中元素、展开面板、输入框未提交内容、当前 appPhase | none | UI | none |
| View State | 对应项目 JSON 内 viewState 字段 | 当前阶段、面板展开状态 | 随 auto-save | UI API | last-write-wins |
| Request State | 内存 Map + requests/ 目录 | requestId → 缓存结果或 Job 状态 | JSON 文件 | MCP Server | requestId 重复时返回缓存 |
| Job State | 内存（运行时）+ 可恢复 | Job 状态、进度、关联 requestId | 进程内 | WanxiangService | 刷新后通过 requestId 重建 |

### Project Storage

```text
[project]/
└── .ai-poster-creation/
    ├── project.json          # 权威海报项目状态（schemaVersion + projectVersion）
    ├── promo-{promoId}.json  # 权威宣传图项目状态（新增）
    ├── projects/             # 项目索引（预留，当前通过文件扫描）
    ├── requests/             # 请求缓存（海报和宣传图共用）
    │   └── req-*.json
    ├── cache/                # 生成的图像（海报底图 + 宣传图）
    │   ├── img_*.png
    │   └── promo_img_*.png
    ├── uploads/              # 用户上传的参考图和商品图
    │   ├── ref-*.png
    │   └── product-*.png
    ├── exports/              # 导出的海报和宣传图
    │   ├── poster_*.png
    │   └── promo_export_*.png
    └── logs/                 # （预留）
```

- schemaVersion：1
- 海报项目文件：`project.json`（保持 v0.2 兼容）
- 宣传图项目文件：`promo-{promoId}.json`（新增格式）
- Atomic Write：写临时文件 + fsync + rename
- Migration：schemaVersion 变化时读取旧格式 + 转换 + 写入新格式
- Cleanup：cache/ 和 exports/ 由用户手动管理

### Asset Lifecycle

| Asset Type | Source | Stored | Reference | Delete Protection | Derived / Cache |
|---|---|---|---|---|---|
| 海报底图 | Wanxiang API 文生图 | cache/ | imagePath (相对路径) | 手动管理 | 不可重新生成（API 非确定性） |
| 宣传图 | Wanxiang API 图生图 | cache/ | promoImage.imagePath (相对路径) | 手动管理 | 可通过重新生成覆盖 |
| 参考图 | 用户上传 | uploads/ | referenceImage.path | 手动管理 | 无 |
| 商品图 | 用户上传 | uploads/ | productImagePath | 手动管理 | 无 |
| 导出文件 | 用户导出 | exports/ | exportResult.filePath | 手动管理 | 可重新导出 |

### Job Lifecycle

```text
queued → running → succeeded / failed / cancelled
```

- 海报底图 Job：8张底图逐个推送 SSE 事件
- 宣传图 Job：单张宣传图，生成完成后推送结果（图片 + 文案）
- Reconnect：页面刷新后通过 requestId 查询 Job 状态；已完成的结果从 request cache 恢复
- Duplicate Request：requestId 幂等缓存，重复请求立即返回已有 jobId
- Progress：海报每张底图完成时推送 SSE 事件；宣传图推送单一事件

## 10. Host Adapters

### claude-code

- Tier：required
- Platform Fact：Claude Code 通过 `claude-plugin` Profile 安装；UI surface 为外部浏览器或 Browser Pane，不支持内嵌 iframe（verified 2026-07-23）
- Runtime Profile：claude-code-browser
- Primary Path：Skill 触发 → Agent 调用 open_poster_editor Tool → Express Server 启动 → 返回 localhost URL → 外部浏览器打开编辑器 → 仪表盘首页 → 用户选择海报或宣传图 → UI ↔ Agent 通过 HTTP API + SSE 双向通信
- UI Surface：外部浏览器（http://localhost:3456）
- Agent Trigger：Skill 触发 + 对话中可调用 generate_copy / generate_poster_images / generate_promo_image Tool
- Agent Result Path：海报底图通过 SSE 推送到 UI → 卡片网格展示；宣传图通过 SSE 推送 → 结果页展示
- Fallback：无——Browser 路径是唯一方案
- Unsupported / Deferred：inline iframe / MCP App 嵌入渲染不在 Claude Code 能力范围
- Install Method：`claude plugin marketplace add <personal_dir>` → `claude plugin install ai-poster-creation@personal` → `/reload-plugins`
- Verification Method：真实 Claude Code 会话中 /generate-poster 或 /generate-promo → 编辑器在浏览器打开 → 仪表盘 → 选择模式 → 生成 → 编辑/导出
- Minimum User Experience：编辑器能在浏览器中打开；仪表盘展示作品列表；海报和宣传图核心流程可完成；导出为高清图片

## 11. Security and Permissions

### Permission Matrix

| Capability | Scope | Reason | User Confirmation | Validation |
|---|---|---|---|---|
| Filesystem | 项目目录 .ai-poster-creation/ | 存储项目状态、生成资产、导出文件 | 安装时声明 | 路径 resolve + 父目录边界检查 |
| Filesystem | 用户选择的导出目录 | 导出 | 导出时浏览器下载 | 服务端仅写 exports/，下载由浏览器处理 |
| Network | dashscope.aliyuncs.com | 通义千问文案生成 + 通义万相文生图 | 安装时声明 | 域名白名单 + HTTPS only |
| Network | *.cn-beijing.maas.aliyuncs.com | 通义万相图生图（商品宣传图） | 安装时声明 | 域名白名单 + HTTPS only |
| Secret | DASHSCOPE_API_KEY | DashScope API 鉴权 | 用户自行配置环境变量 | 服务端读取，不暴露给 UI 和日志 |

### Threat Model

同 v0.2 Design §11 Threat Model（6条威胁全部保留）。

新增/修订：

| THR ID | Asset | Entry | Threat | Impact | Mitigation | Verification | Related ID |
|---|---|---|---|---|---|---|---|
| THR-007 | 商品图 | HTTP POST 上传 | 大文件/非图片/压缩炸弹 | 磁盘耗尽、服务崩溃 | magic bytes 校验（PNG/JPEG/WebP）；限制 10MB | 负面测试：伪装的 exe 文件 | SEC-003, DATA-004 |
| THR-008 | 商品图 | API 传输 | 商品图包含敏感信息传输到外部 API | 隐私泄露 | 告知用户商品图将被发送到阿里云 DashScope API 处理；不做本地过滤 | 文档披露 + 安装时声明 | SEC-002 Rev3 |

### CSP / Sandbox / Message Rules

同 v0.2 Design §11 CSP——connect-src 扩展为 `https://*.cn-beijing.maas.aliyuncs.com`。

## 12. Visual and Accessibility Rules

同 v0.2 Design §12（warm-playful token 体系、排版层级、动效、键盘路径、焦点管理、对比度、Host Theme 不变）。

新增仪表盘和宣传图特定规则：

- 仪表盘作品卡片：200px × 220px，缩略图 200px × 150px（object-fit: cover），类型标签 40px × 24px 圆角徽章（海报=暖橙色底，宣传图=薄荷绿底），标题 14px/600，日期 12px/400 辅助色
- 模式选择浮层：520px × 360px 毛玻璃模态框，两个选项卡片等大（220px × 260px），图标 64px，标题 18px/600，描述 13px/400
- 宣传图上传区：280px × 280px 虚线边框区域（#F0E4DB border, dashed），拖入时边框色变为 #FF6B6B solid
- 宣传图结果预览：最大宽度 600px，保持原始宽高比，圆角 12px，阴影 wp-shadow-canvas

## 13. UI State Catalog

新增/修订状态（保留 v0.2 全部海报状态）：

| State | Trigger | User Sees | Available Action | Data Preserved | Exit |
|---|---|---|---|---|---|
| Dashboard·Empty | 首次打开，无作品 | 中置引导插画 + "还没有作品" + 新建按钮 | 点击新建 → 模式选择 | 无 | 创建第一个作品 |
| Dashboard·Loaded | 仪表盘加载完成，有作品 | 作品卡片网格 + 标题 + 新建按钮 | 点击作品卡片打开、新建创作 | 作品元数据 | 进入创作流程 |
| Dashboard·ModeSelect | 点击新建按钮 | 模式选择浮层——海报制作 / 宣传图制作 | 选择模式、关闭浮层 | 无 | 选择后进入对应流程 |
| Promo·Input | 选择宣传图制作 | 中置卡片——商品图上传区 + 提示词输入框 | 上传图片、输入描述 | 无 | 点击生成 |
| Promo·Generating | 点击生成宣传图 | 进度条 + 取消按钮 | 取消生成 | 输入内容已保存 | 生成完成或取消 |
| Promo·Result | 生成完成 | 宣传图大图 + 文案 + 操作按钮 | 重新生成、导出 PNG/JPG、返回仪表盘 | 完整项目状态 | 导出或返回 |
| Promo·Error | 生成失败 | 错误卡片 + 错误原因 + 重试按钮 | 重试、修改参数重试、返回仪表盘 | 输入内容已保存 | 重试成功或返回 |
| Close / Reopen | 用户关闭浏览器后重新打开 | 仪表盘首页（加载作品列表）；如 URL 有 projectId/promoId 则直接进入对应项目 | 继续操作 | 上次保存的完整状态 | N/A |

## 14. Prototype Evidence

无新增 Prototype 要求。原 SPIKE-001（画布约束编辑验证）PASS，结论适用。

通义万相图生图能力需在 Build 阶段进行 API Probe 验证商品主体一致性（DEC-009 风险假设 #2），但不是 Design 阶段的 Prototype Gate 要求。

## 15. Scenario Walkthroughs

### Scenario 1 · First Open (v0.3 修订)

| Step | User Sees | User Does | System / Agent | State | Failure / Recovery |
|---|---|---|---|---|---|
| 1 | 浏览器打开，仪表盘首页 + 暖色渐变背景 | 看到空状态引导："还没有作品" | Express Server 就绪，list_projects 返回空数组 | 空状态 | 页面加载失败 → 浏览器默认错误页 |
| 2 | 中置引导 + [+ 新建创作] 按钮 | 点击 [+ 新建创作] | 弹出模式选择浮层，毛玻璃遮罩 | UI ephemeral | N/A |
| 3 | 模式选择浮层——两个选项卡片 | 点击"海报制作" | 关闭浮层，跳转到海报生成阶段中置向导 | appPhase=poster | N/A |

### Scenario 2 · Promo Core Task (Upload → Generate → Review → Export)

| Step | User Sees | User Does | System / Agent | State | Failure / Recovery |
|---|---|---|---|---|---|
| 1 | 仪表盘首页 | 点击新建 → 选择"宣传图制作" | 跳转到宣传图输入阶段 | appPhase=promo | N/A |
| 2 | 中置卡片——商品图上传区 + 提示词输入框 | 拖入一张保温杯照片（PNG, 2MB），输入"将这款保温杯放在温暖咖啡店场景中，木质桌面，柔和灯光，突出不锈钢质感" | 即时显示缩略图预览，字符计数 | UI ephemeral | 文件非图片 → 提示"仅支持 PNG/JPG/WEBP" |
| 3 | 上传完成，提示词已填写 | 点击 [✨ 生成宣传图] | POST /api/generate/promo → generate_promo_image Tool → Qwen + Wanxiang 并行调用 | input saved, promoVersion 1 | API 超时 → 显示重试 |
| 4 | 进度条展示 | 等待 | Wanxiang 图生图 + Qwen 文案生成中 | Job: running | 取消 → 保留输入内容 |
| 5 | 结果页——宣传图大图 + 宣传文案 | 审阅效果 | 图片为保温杯在咖啡店场景中的宣传图，文案包含标题和卖点 | promoVersion 2 (auto-save) | 若效果不佳 → 点击重新生成 |
| 6 | 结果满意 | 点击 [📤 导出 PNG] | export_poster Tool → 浏览器下载 | exports/promo_export_*.png | 导出失败 → 提示错误+重试 |
| 7 | 导出完成 | 点击 [← 返回仪表盘] | 返回仪表盘，新作品卡片出现在列表中 | appPhase=dashboard | N/A |

### Scenario 3 · Dashboard Reopen and Project Navigation

| Step | User Sees | User Does | System / Agent | State | Failure / Recovery |
|---|---|---|---|---|---|
| 1 | 仪表盘首页 | 看到5个作品卡片（3海报+2宣传图），按日期倒序排列 | list_projects 扫描 .ai-poster-creation/ 汇总 | 作品列表 | 扫描失败 → 提示"作品列表加载失败，请刷新" |
| 2 | 点击一张海报作品卡片"双十一促销" | 进入海报编辑阶段，完整恢复上次编辑状态 | load project.json → 恢复画布/文案/样式 | posterPhase=editing | 项目文件损坏 → 提示"项目损坏"返回仪表盘 |
| 3 | 编辑完成后返回仪表盘 | 点击 [← 返回仪表盘] | auto-save → 返回仪表盘，作品卡片更新时间为"刚刚" | appPhase=dashboard | N/A |
| 4 | 点击一张宣传图作品卡片"保温杯宣传" | 进入宣传图结果页，显示上次生成的图片和文案 | load promo-{id}.json → 恢复结果状态 | promoPhase=result | N/A |

### Scenario 4-7

场景 4-7（Agent Failure、Stale Result、File/Permission Failure、Host Fallback）同 v0.2 Design §15，海报部分逻辑不变。新增宣传图相关的失败处理见 Scenario 2 的 Failure 列。

## 16. Open Questions

- P0：无
- P1：
  1. 长时间编辑下 warm-playful 暖色背景是否舒适（需真实使用反馈，不影响首版交付）
  2. 通义万相图生图对商品主体保持的一致性程度（需 Build 阶段 API Probe 验证）
  3. 宣传图生成的文案是否需要嵌入图片中还是独立展示（当前设计为独立展示，如需要嵌入则需调整图生图 prompt）
- P2：
  1. 是否需要暗色模式（Backlog，首版仅亮色）
  2. 仪表盘是否需要筛选/搜索/排序功能（首版作品数量有限，暂不需要）

## 17. Design-to-Plan Handoff

- Required Vertical Slices（v0.3 新增标 ★）：
  1. warm-playful visual tokens（tokens.css）+ 基础布局骨架（TopBar + 状态机骨架）
  2. ★ 仪表盘首页（Dashboard 组件 + 作品列表卡片 + 空状态 + 模式选择浮层）
  3. ★ 宣传图生成流程（PromoCreator 组件——上传区 + 提示词输入 + 进度条 + 结果页）
  4. ★ 三阶段状态机（App.tsx appPhase: dashboard | poster | promo）
  5. 海报生成阶段中置向导（InputPanel + ProgressBar + LayoutGrid）——保留不变
  6. 海报编辑阶段左导航 + 扩展面板（LeftNav + ExpandPanel + CopyPanel + ThumbnailStrip + CanvasPanel + PropertiesPanel）——保留不变
  7. ★ 新增 MCP Tool：generate_promo_image + list_projects + promo_project_state
  8. 顶部工具栏 + 导出 + 撤销/重做（扩展至三阶段）
- Required Spikes Resolved：无（SPIKE-001 已覆盖画布交互）
- Required API Probes：通义万相图生图商品主体一致性 Probe（Build Phase 1）
- Required Host Tests：claude-code 真实会话中完整走通 AC-001~AC-011
- Highest-risk Build Order：先建状态机骨架（三阶段切换）→ 仪表盘 → 宣传图流程 → API Probe → 海报流程（保留）→ 工具栏/导出整合
- Acceptance Mapping：

| AC | Design Section | Verification Scenario |
|---|---|---|
| AC-001 | 4 / 5 / 6 / 7 | Scenario 1 Steps 1-3 → 海报 Scenario 2 Steps 1-3 |
| AC-002 | 4 / 5 | Scenario 2 Step 4（海报） |
| AC-003 | 5 / 6 | Scenario 2 Steps 5-6（海报） |
| AC-004 | 5 / 7 | Scenario 2 Step 7（海报） |
| AC-005 | 6 / 7 | Scenario 2 (with referenceImage) |
| AC-006 | 13 | Scenario 4 |
| AC-007 | 9 / 13 | Scenario 3 |
| AC-008 | 4 / 5 | Scenario 2 extended（切换版式缩略图） |
| AC-009 | 4 / 5 | Scenario 1 Steps 1-2, Scenario 3 |
| AC-010 | 4 / 7 | Scenario 2（宣传图全流程） |
| AC-011 | 4 / 5 | Scenario 1 Steps 2-3 |
