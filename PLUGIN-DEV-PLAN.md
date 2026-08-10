# Plugin Development Plan

## 0. Document Control

- Plugin ID：ai-poster-creation
- Plan Version：0.3.0
- Status：PLAN_READY
- Spec Version：0.3.0
- Design Version：0.3.0
- Required Targets：claude-code
- Created：2026-08-09
- Last Updated：2026-08-09

## 1. Delivery Strategy

- Critical Path：shared 类型扩展（AppPhase/PromoProject/DashboardItem）→ App.tsx 三阶段状态机 → Dashboard 组件 → PromoCreator 组件 → MCP Server 新增 Tool → API Probe 验证图生图
- First Vertical Round-trip：启动 Express → 浏览器打开仪表盘首页 → 空状态引导 → 新建 → 选择宣传图 → 上传商品图+提示词 → 调用 generate_promo_image → 结果页展示宣传图+文案 → 导出 → 返回仪表盘
- Highest Risk：通义万相图生图 (wan2.7-image-pro) 对商品主体保持的一致性未验证（Phase 4 API Probe 消除）
- Risk Retirement Phase：Phase 4
- UI Complexity：B
- Shared Core Boundary：packages/shared（types.ts 扩展 AppPhase/PromoProject/DashboardItem/PromoCopyContent，layouts.ts 保留不变）；packages/mcp-server（新增 WanxiangService.generatePromoImage、StateService 新增 promo 方法、新增 list_projects/promo_project_state/generate_promo_image Tool）
- Host Adapter Boundary：packages/ui（App.tsx 状态机三阶段扩展、新增 Dashboard/PromoCreator/ModeSelector 组件、TopBar 适配三阶段、现有海报组件保留不变）
- Non-goals Guard：不修改海报生成/编辑流程代码（InputPanel/LayoutGrid/CanvasPanel/PropertiesPanel/CopyPanel/LeftNav/ExpandPanel/ThumbnailStrip）；不修改 LAYOUTS 版式定义；不修改 QwenService 文案生成逻辑；不修改导出核心逻辑；宣传图不提供画布编辑

## 2. Requirement and Acceptance Index

| ID | Priority / Tier | Design Section | Implementation Task | Verification Task | Status |
|---|---|---|---|---|---|
| REQ-001 | must | 7 / 8 | TASK-101（保留） | TASK-131 | pending |
| REQ-002 | must | 7 / 8 | TASK-101（保留） | TASK-131 | pending |
| REQ-003 | must | 7 / 8 | TASK-101（保留） | TASK-131 | pending |
| REQ-004 | must | 5 / 6 | TASK-101（保留） | TASK-131 | pending |
| REQ-005 | must | 5 / 6 | TASK-101（保留） | TASK-131 | pending |
| REQ-006 | must | 5 / 7 | TASK-101（保留）、TASK-122 | TASK-131 | pending |
| REQ-007 | must | 9 | TASK-101（保留） | TASK-131 | pending |
| REQ-008 | must | 4 / 7 / 8 | TASK-109, TASK-110, TASK-111, TASK-112, TASK-113 | TASK-132 | pending |
| REQ-009 | must | 4 / 5 / 9 | TASK-106, TASK-107, TASK-108, TASK-116 | TASK-133 | pending |
| UX-001 | must | 5 / 13 | TASK-101（保留）、TASK-114 | TASK-131 | pending |
| UX-002 Rev2 | must | 4 / 5 | TASK-101（保留） | TASK-131 | pending |
| UX-003 Rev2 | must | 4 / 5 | TASK-101（保留） | TASK-131 | pending |
| UX-004 Rev2 | must | 5 | TASK-101（保留） | TASK-131 | pending |
| UX-005 | must | 4 / 5 | TASK-101（保留）、TASK-105 | TASK-131 | pending |
| UX-006 | must | 4 / 5 | TASK-101（保留） | TASK-131 | pending |
| UX-007 | must | 12 | TASK-101（保留） | TASK-131 | pending |
| UX-008 | must | 4 / 5 | TASK-106, TASK-107, TASK-108 | TASK-133 | pending |
| UX-009 | must | 4 / 5 / 7 | TASK-109, TASK-110, TASK-111, TASK-112 | TASK-132 | pending |
| HOST-001 | must | 10 | TASK-126, TASK-127 | TASK-135 | pending |
| HOST-002 | must | 7 | TASK-115, TASK-116, TASK-117 | TASK-134 | pending |
| DATA-001 | must | 9 | TASK-101（保留）、TASK-118 | TASK-131 | pending |
| DATA-002 | must | 9 | TASK-101（保留） | TASK-131 | pending |
| DATA-003 | must | 9 | TASK-101（保留） | TASK-131 | pending |
| DATA-004 | must | 9 | TASK-109, TASK-118 | TASK-132 | pending |
| SEC-001 | must | 11 | TASK-101（保留） | TASK-134 | pending |
| SEC-002 Rev3 | must | 11 | TASK-115（域名扩展） | TASK-134 | pending |
| SEC-003 | must | 11 | TASK-101（保留）、TASK-118 | TASK-134 | pending |
| NFR-001 | should | 7 | TASK-101（保留） | TASK-131 | pending |
| NFR-002 | should | 7 | TASK-101（保留） | TASK-131 | pending |
| NFR-003 | should | 6 / 7 | TASK-101（保留） | TASK-131 | pending |
| NFR-004 | must | 5 / 7 | TASK-101（保留） | TASK-131 | pending |
| NFR-005 | must | 7 | TASK-113 | TASK-132 | pending |
| AC-001 | required | 4/5/6/7 | TASK-101（保留） | TASK-131 | pending |
| AC-002 | required | 4 / 5 | TASK-101（保留） | TASK-131 | pending |
| AC-003 | required | 5 / 6 | TASK-101（保留） | TASK-131 | pending |
| AC-004 | required | 5 / 7 | TASK-101（保留）、TASK-122 | TASK-131 | pending |
| AC-005 | required | 6 / 7 | TASK-101（保留） | TASK-131 | pending |
| AC-006 | required | 13 | TASK-101（保留） | TASK-131 | pending |
| AC-007 | required | 9 / 13 | TASK-101（保留） | TASK-131 | pending |
| AC-008 | required | 4 / 5 | TASK-101（保留） | TASK-131 | pending |
| AC-009 | required | 4 / 13 | TASK-106, TASK-107 | TASK-133 | pending |
| AC-010 | required | 4 / 7 / 13 | TASK-109, TASK-110, TASK-111, TASK-112, TASK-113 | TASK-132 | pending |
| AC-011 | required | 9 / 13 | TASK-106, TASK-116, TASK-118 | TASK-133 | pending |

## 3. Component Map

```text
ai-poster-creation/
├── .claude-plugin/
│   └── plugin.json              # 更新 version → 0.3.0，新增 generate-promo Skill
├── skills/                      # 保留 3 个 + 新增 generate-promo
│   ├── generate-poster/SKILL.md
│   ├── edit-poster/SKILL.md
│   ├── export-poster/SKILL.md
│   └── generate-promo/SKILL.md  # ★ 新增
├── .mcp.json                    # 保留
├── packages/
│   ├── shared/                  # 微调类型扩展
│   │   └── src/
│   │       ├── types.ts         # ★ 扩展：AppPhase/PromoProject/DashboardItem/PromoCopyContent 类型
│   │       ├── layouts.ts       # 不变
│   │       └── index.ts
│   ├── ui/                      # ★ 仪表盘 + 宣传图组件新增，海报组件保留
│   │   ├── kit/
│   │   │   ├── tokens.css       # 保留（warm-playful 不变）
│   │   │   └── components.css   # ★ 扩展：新增 dashboard/promo 相关 CSS class
│   │   ├── src/
│   │   │   ├── App.tsx          # ★ 重写：三阶段状态机（dashboard/poster/promo）
│   │   │   ├── main.tsx         # 保留
│   │   │   └── components/
│   │   │       ├── TopBar.tsx           # ★ 扩展：适配三阶段不同内容
│   │   │       ├── LeftNav.tsx          # 保留（仅海报编辑阶段使用）
│   │   │       ├── ExpandPanel.tsx      # 保留
│   │   │       ├── CopyPanel.tsx        # 保留
│   │   │       ├── InputPanel.tsx       # 保留
│   │   │       ├── LayoutGrid.tsx       # 保留
│   │   │       ├── ProgressBar.tsx      # ★ 扩展：适配宣传图单张进度
│   │   │       ├── ThumbnailStrip.tsx   # 保留
│   │   │       ├── CanvasPanel.tsx      # 保留
│   │   │       ├── PropertiesPanel.tsx  # 保留
│   │   │       ├── Dashboard.tsx        # ★ 新增：仪表盘首页
│   │   │       ├── ModeSelector.tsx     # ★ 新增：模式选择浮层
│   │   │       └── PromoCreator.tsx     # ★ 新增：宣传图制作全流程
│   │   ├── index.html
│   │   ├── vite.config.ts       # 保留
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── mcp-server/              # ★ 扩展新增 Tool
│       ├── src/
│       │   ├── index.ts         # ★ 扩展：注册新 Tool
│       │   └── services/
│       │       ├── qwen.ts      # 保留
│       │       ├── wanxiang.ts  # ★ 扩展：新增 generatePromoImage 方法
│       │       ├── state.ts     # ★ 扩展：新增 promo State 方法 + listProjects
│       │       └── security.ts  # 保留
│       ├── package.json
│       └── tsconfig.json
├── contracts/                   # ★ 新增 promo-result.schema.json
│   ├── request.schema.json
│   ├── result.schema.json
│   ├── state.schema.json
│   ├── evidence.schema.json
│   └── promo-result.schema.json # ★ 新增
├── tests/                       # 保留 + 新增 promo/probe
├── evidence/                    # v0.3 证据目录
├── start-server.mjs             # ★ 扩展：新增 promo API 路由
├── package.json
└── tsconfig.json
```

## 4. Phase 0 · Scaffold & Contracts

- Status：not_started
- Entry Gate：Spec v0.3 SPEC_VALID + Design v0.3 DESIGN_VALID
- Exit Gate：shared 类型扩展完成 + contracts 就绪 + 新组件文件骨架存在 + 现有 v0.2 代码 typecheck 通过（确认基线未被破坏）
- Rollback：git checkout 恢复到此 Phase 前

### TASK-101 · 基线确认：v0.2 代码 typecheck + build 通过

- Status：pending
- Goal：确认 v0.2 全部代码（海报生成/编辑、MCP Server、API 路由）在进入 v0.3 开发前 typecheck 和 build 通过，建立可回退基线
- Related IDs：all v0.2 IDs
- Inputs：全部 v0.2 源码
- Files：packages/shared/, packages/ui/, packages/mcp-server/
- Dependencies：none
- Implementation Boundary：仅运行验证，不修改任何源码
- Commands：
    - `npm run typecheck`
    - `npm run build`
- Completion Criteria：
    - `npm run typecheck` 通过（零错误）
    - `npm run build` 成功产生 dist/
- Evidence：
    - evidence/phase0/task-101-baseline.txt（typecheck + build 输出）
- Failure / Rollback：如 v0.2 基线已损坏，先修复到可构建状态再继续
- Parallel Safety：无并行任务

### TASK-102 · shared 类型扩展：AppPhase / PromoProject / DashboardItem / PromoCopyContent

- Status：pending
- Goal：在 packages/shared/src/types.ts 中新增 v0.3 需要的全部类型定义，保持向后兼容
- Related IDs：REQ-008, REQ-009, UX-008, UX-009, DATA-004
- Inputs：Design §4 Core Objects, Design §9 State Layers, contracts/promo-result.schema.json
- Files：packages/shared/src/types.ts
- Dependencies：TASK-101
- Implementation Boundary：
    - 新增 `AppPhase = "dashboard" | "poster" | "promo"` 类型（替代旧的 `AppPhase = "generation" | "editing"`，但旧类型保留别名兼容）
    - 新增 `PromoPhase = "input" | "generating" | "result" | "error"` 类型
    - 新增 `PromoProject` 接口：promoId, type: "promo", title?, productImagePath, prompt, promoPhase, promoImage?, promoCopy?, projectVersion, createdAt, updatedAt, schemaVersion
    - 新增 `PromoCopyContent` 接口：promoTitle, promoDescription, promoHighlights[]
    - 新增 `DashboardItem` 接口：id, type ("poster"|"promo"), title, thumbnailPath?, createdAt, updatedAt
    - 新增 `PromoResult` 接口（映射 promo-result.schema.json）
    - 不修改现有 ProjectState, CopyContent, TextElement, GeneratedImage 等类型
- Commands：
    - `npm run typecheck -w packages/shared`
- Completion Criteria：
    - 新类型定义完整，字段与 Design §4 Core Objects 一致
    - typecheck 通过
    - 现有类型不受影响
- Evidence：
    - evidence/phase0/task-102-types.txt（`npx tsc --noEmit` 输出）
- Failure / Rollback：还原 types.ts 到 v0.2
- Parallel Safety：可与 TASK-103 并行（不同文件）

### TASK-103 · 新组件文件骨架创建

- Status：pending
- Goal：创建 Dashboard.tsx / ModeSelector.tsx / PromoCreator.tsx 三个新组件的空骨架文件
- Related IDs：UX-008, UX-009, REQ-009
- Inputs：Design §4 Workspace Map（仪表盘 + 宣传图布局）
- Files：
    - packages/ui/src/components/Dashboard.tsx（NEW）
    - packages/ui/src/components/ModeSelector.tsx（NEW）
    - packages/ui/src/components/PromoCreator.tsx（NEW）
- Dependencies：TASK-101
- Implementation Boundary：每个文件只导出带 displayName 的空组件（返回 `<div>` 占位）；不实现逻辑
- Commands：
    - `npm run typecheck`
- Completion Criteria：
    - 3 个新组件文件存在
    - typecheck 无导入路径错误
- Evidence：
    - evidence/phase0/task-103-skeleton.txt（`ls -la` 输出）
- Failure / Rollback：删除新建的空文件
- Parallel Safety：可与 TASK-102 并行（不同文件）

### TASK-104 · contracts/promo-result.schema.json 确认

- Status：pending
- Goal：确认 promo-result.schema.json 存在且通过 JSON Schema 校验，与 Design §6 Result Contract（宣传图）一致
- Related IDs：REQ-008, AC-010
- Inputs：Design §6 Result Contract（宣传图）, contracts/promo-result.schema.json
- Files：contracts/promo-result.schema.json
- Dependencies：TASK-101
- Implementation Boundary：仅验证 Schema 文件存在且字段与 Design 一致；contracts/promo-result.schema.json 已由 Design 阶段生成（v0.3）
- Commands：
    - `python3 "C:/Users/Administrator/claude-plugins/plugins/interactive-plugin-builder/skills/interactive-plugin-builder/scripts/validate-plugin-project.py" --root .`
- Completion Criteria：
    - promo-result.schema.json 存在
    - Validator 无 SCHEMA 错误
- Evidence：
    - evidence/phase0/task-104-contracts.txt（validator 输出）
- Failure / Rollback：修正 Schema 文件使其与 Design §6 一致
- Parallel Safety：可与 TASK-102, TASK-103 并行

## 5. Phase 1 · Three-Phase State Machine

- Status：not_started
- Entry Gate：Phase 0 Exit Gate（类型扩展 + 骨架 + contracts 就绪）
- Exit Gate：App.tsx 三阶段状态机运行——dashboard / poster / promo 三阶段可切换；TopBar 适配三阶段显示不同内容
- Rollback：还原 App.tsx 和 TopBar.tsx 到 v0.2

### TASK-105 · App.tsx 三阶段状态机重写

- Status：pending
- Goal：将 App.tsx 从两阶段状态机（generation/editing）扩展为三阶段（dashboard/poster/promo），保留海报全部现有逻辑
- Related IDs：UX-005, UX-008, UX-009, DEC-007
- Inputs：Design §4 Workspace Map, Design §13 UI State Catalog, 当前 App.tsx（两阶段状态机）
- Files：packages/ui/src/App.tsx
- Dependencies：TASK-102, TASK-103
- Implementation Boundary：
    - 定义新 `AppPhase = "dashboard" | "poster" | "promo"`（替代旧 `"generation" | "editing"`）
    - 海报阶段用嵌套 `posterPhase: "generation" | "editing"` 管理（内部 genSubPhase 保留 "input"|"generating"|"layout_select"）
    - 宣传图阶段用 `promoPhase: "input" | "generating" | "result" | "error"` 管理
    - dashboard：渲染 Dashboard 组件（骨架占位），TopBar 显示标题 + 无操作按钮
    - poster：完全保留 v0.2 generation/editing 全部逻辑和 UI（InputPanel, LayoutGrid, ProgressBar, CanvasPanel, LeftNav, ExpandPanel, PropertiesPanel, ThumbnailStrip, CopyPanel）
    - promo：渲染 PromoCreator 组件（骨架占位），TopBar 显示"← 返回仪表盘"
    - 新增 dashboard state：projects (DashboardItem[]), loading
    - 新增 promo state：promoId, productImage (File|null), productImagePreview (string), promoPrompt, promoPhase, promoImage, promoCopy, promoJobStatus
    - 保留全部海报 state 不变（theme, scene, style, size, referenceImage, copy, generatedImages, selectedLayout, textElements, jobStatus, undoStack, redoStack, saveStatus）
    - 保留 auto-save useEffect、handleGenerateCopy、handleGenerateImages、handleSelectLayout、handleStartEditing、handleSave、handleExport、handleUndo、handleRedo 全部函数
    - 新增：handleNewCreation（打开 ModeSelector）、handleSelectMode("poster"|"promo")、handleBackToDashboard、handleOpenProject(item: DashboardItem)
    - URL 参数初始化：无参数 → dashboard；有 projectId → 判断类型后跳转 poster editing 或 promo result；有 promoId → promo result
- Commands：
    - `npm run typecheck`
- Completion Criteria：
    - 初始加载显示 dashboard 阶段
    - 可从 dashboard 切换到 poster（generation 子阶段）
    - 可从 dashboard 切换到 promo（input 子阶段）
    - 可从 poster/promo 返回 dashboard
    - 海报 generation → editing 切换正常（回归验证）
    - typecheck 零错误
- Evidence：
    - evidence/phase1/task-105-state-machine.txt（typecheck 输出 + 手动切换验证记录）
- Failure / Rollback：还原 App.tsx 到 v0.2
- Parallel Safety：不可与 TASK-106, TASK-107 并行（App.tsx 是共享上下文）

### TASK-106 · TopBar 三阶段适配

- Status：pending
- Goal：扩展 TopBar 组件，根据 appPhase 显示不同内容——仪表盘显示标题+新建按钮，海报阶段保持原有逻辑，宣传图显示返回按钮
- Related IDs：DEC-006, DEC-007, UX-008
- Inputs：Design §4 Workspace Map（各阶段 TopBar 内容）, 当前 TopBar.tsx
- Files：packages/ui/src/components/TopBar.tsx
- Dependencies：TASK-105
- Implementation Boundary：
    - 新增 Props：appPhase, onNewCreation, onBackToDashboard
    - dashboard 阶段：左侧 Logo "🍊 AI 海报生成器"（wp-h2, warm gradient text），右侧 [+ 新建创作] 按钮（wp-btn--primary, 圆角 12px）
    - poster 阶段：保持 v0.2 逻辑——generation 子阶段仅 Logo，editing 子阶段左侧 Logo+保存+撤销/重做，右侧导出 PNG/JPG
    - promo 阶段：左侧 [← 返回仪表盘] 按钮（wp-btn--quiet），中央标题 "商品宣传图"
    - 高度 56px，背景 wp-surface-glass + backdrop-blur 保持不变
- Commands：
    - `npm run typecheck`
- Completion Criteria：
    - 仪表盘阶段显示 [+ 新建创作] 按钮
    - 宣传图阶段显示 [← 返回仪表盘]
    - 海报阶段行为与 v0.2 一致（回归）
    - 视觉符合 warm-playful 风格
- Evidence：
    - evidence/phase1/task-106-topbar.png（三阶段截图合集）
- Failure / Rollback：还原 TopBar.tsx 到 v0.2
- Parallel Safety：不可与 TASK-105 并行（共享 App.tsx 上下文）

## 6. Phase 2 · Dashboard Homepage

- Status：not_started
- Entry Gate：Phase 1 Exit Gate（三阶段状态机可切换）
- Exit Gate：仪表盘首页完整可用——空状态引导 + 作品卡片网格 + 模式选择浮层 + 点击作品卡片跳转
- Rollback：移除 Dashboard 和 ModeSelector 组件，还原 App.tsx 中 dashboard 渲染

### TASK-107 · Dashboard 仪表盘首页组件

- Status：pending
- Goal：实现仪表盘首页——作品卡片网格、空状态引导、加载状态，卡片显示缩略图/标题/类型标签/日期
- Related IDs：REQ-009, UX-008, DEC-007, DEC-010, AC-009
- Inputs：Design §4 Workspace Map（仪表盘首页）, Design §12 Visual Rules（卡片/徽章规格）
- Files：packages/ui/src/components/Dashboard.tsx
- Dependencies：TASK-105, TASK-106
- Implementation Boundary：
    - Props：projects (DashboardItem[]), loading, onOpenProject(item), onNewCreation
    - **空状态**（projects.length === 0 && !loading）：中置引导——大号插画图标 🎨（64px）、"还没有作品"（wp-h2）、"创建你的第一张海报或商品宣传图"（wp-body 辅助色）、[+ 新建创作] 按钮（wp-btn--primary wp-btn--lg）
    - **加载状态**（loading）：3 张骨架卡片（wp-skel, 200px×220px）
    - **作品列表**（projects.length > 0）：
      - 顶部：标题 "📊 我的作品"（左对齐）+ 作品计数 "N 个作品"（辅助色）+ [+ 新建创作] 按钮（右对齐）
      - 卡片网格：`display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 16px; padding: 24px`
      - 每张卡片（200px×220px, wp-card, wp-radius-lg）：缩略图区 200px×150px（无缩略图时显示占位图标 🎨/📦）、类型标签（40×24px 圆角徽章，海报=暖橙色底 `#FFF0E8` + 文字 `#FF6B6B`，宣传图=薄荷绿底 `#E8FFF4` + 文字 `#4ECDC4`）、标题（14px/600，单行截断）、日期（12px/400 辅助色）
      - 卡片 hover：放大 1.02x + 阴影增强，transition 200ms ease
      - 点击卡片 → onOpenProject(item)
- Commands：
    - `npm run typecheck`
- Completion Criteria：
    - 空状态正确显示引导插画和新建按钮
    - 加载状态显示 3 张骨架卡片
    - 作品列表卡片网格正确渲染（缩略图占位、标题、类型标签、日期）
    - 海报和宣传图卡片有不同颜色类型标签
    - 卡片 hover 放大效果
    - 点击卡片触发 onOpenProject
- Evidence：
    - evidence/phase2/task-107-dashboard.png（空状态 + 加载 + 列表三张截图）
- Failure / Rollback：删除 Dashboard.tsx
- Parallel Safety：可与 TASK-108 并行（不同文件，ModeSelector 不依赖 Dashboard）

### TASK-108 · ModeSelector 模式选择浮层

- Status：pending
- Goal：实现模式选择浮层——毛玻璃遮罩 + 两个大卡片选项（海报制作/宣传图制作）+ 关闭按钮
- Related IDs：UX-008, DEC-007, AC-009
- Inputs：Design §4 Workspace Map（模式选择浮层）, Design §12 Visual Rules（模态框/卡片规格）
- Files：packages/ui/src/components/ModeSelector.tsx
- Dependencies：TASK-105
- Implementation Boundary：
    - Props：isOpen, onClose, onSelect(mode: "poster" | "promo")
    - 遮罩：wp-scrim（固定定位，背景 rgba(0,0,0,0.3) + backdrop-filter blur(4px)），点击关闭
    - 模态框：520px×360px, wp-card, wp-radius-xl, wp-shadow-elevated, 居中定位
    - 标题栏："选择创作类型" + ✕ 关闭按钮（右上角 wp-btn--icon）
    - 两个选项卡片（等大 220px×260px, wp-card, wp-radius-lg）：
      - **海报制作**：图标 🎨（64px, 居中）、标题 "海报制作"（18px/600）、描述 "AI 生成 8 种版式 / 在线编辑微调 / 文案精准嵌入"（13px/400 辅助色）
      - **宣传图制作**：图标 📦（64px, 居中）、标题 "宣传图制作"（18px/600）、描述 "上传商品图片 / AI 生成宣传图 / 自动输出文案"（13px/400 辅助色）
    - 卡片 hover：放大 1.03x + 阴影增强 + 边框色变为 wp-primary，200ms ease
    - 点击卡片 → onSelect(mode) → 关闭浮层
    - 过渡动画：遮罩 fadeIn 200ms，模态框 scale(0.95→1) + fadeIn 300ms ease-out
- Commands：
    - `npm run typecheck`
- Completion Criteria：
    - 浮层以毛玻璃遮罩 + 缩放动画打开
    - 两个选项卡片正确显示图标/标题/描述
    - 点击卡片触发 onSelect 并关闭浮层
    - 点击遮罩或 ✕ 关闭浮层
    - 视觉符合 warm-playful 风格
- Evidence：
    - evidence/phase2/task-108-modeselector.png（浮层打开 + hover 状态截图）
- Failure / Rollback：删除 ModeSelector.tsx
- Parallel Safety：可与 TASK-107 并行（不同文件）

## 7. Phase 3 · Promo Creator UI

- Status：not_started
- Entry Gate：Phase 2 Exit Gate（仪表盘完整可用）
- Exit Gate：宣传图制作完整 UI 流程可操作——上传商品图 → 输入提示词 → 生成按钮 → 进度条 → 结果页（用 Mock 数据验证 UI 状态切换）
- Rollback：移除 PromoCreator 组件，还原 ProgressBar 扩展

### TASK-109 · PromoCreator 宣传图制作全流程组件

- Status：pending
- Goal：实现宣传图制作全流程——商品图上传区 + 提示词输入 + 生成按钮 + 进度条 + 结果审阅页 + 导出按钮，用中置卡片式布局
- Related IDs：REQ-008, UX-009, DEC-008, DATA-004, AC-010
- Inputs：Design §4 Workspace Map（宣传图制作流程）, Design §5 Action Map（宣传图操作）, Design §12 Visual Rules（上传区/结果预览规格）
- Files：packages/ui/src/components/PromoCreator.tsx
- Dependencies：TASK-105
- Implementation Boundary：
    - Props：promoPhase, productImage, productImagePreview, promoPrompt, promoImage (PromoImage|null), promoCopy (PromoCopyContent|null), promoJobStatus, onImageUpload(file), onPromptChange(text), onGenerate(), onCancel(), onRegenerate(), onExport(format), onBackToDashboard
    - 整体布局：中置卡片式（与海报生成阶段统一），max-width 560px，垂直居中
    - **输入阶段**（promoPhase === "input"）：
      - 卡片标题 "📦 商品宣传图"（wp-h2）
      - 商品图上传区：280px×280px 虚线边框区域（border: 2px dashed #F0E4DB, border-radius: 12px），未上传时显示 "📤 拖拽或点击上传商品图" + "支持 PNG/JPG/WEBP，最大 10MB"（wp-note）；已上传时显示缩略图预览（280px×280px, object-fit: cover, border-radius: 12px）+ 右下角"重新上传"小按钮
      - 提示词输入区：标签 "✏️ 商品特色描述"（wp-label）+ textarea（wp-field, min-height: 100px, placeholder: "描述商品特色和期望的宣传图风格..."）+ 字数统计（wp-note）
      - 生成按钮：[✨ 生成宣传图]（wp-btn--primary wp-btn--lg, width: 100%, 暖色渐变），disabled 当无图片或无提示词
    - **进度阶段**（promoPhase === "generating"）：
      - 复用 ProgressBar 组件（单张进度条，不确定模式来回扫描）
      - 文案 "正在生成宣传图..."（wp-body）+ 状态提示 "AI 正在根据商品图和描述创作宣传图"（wp-note）
      - [取消生成] 按钮（wp-btn--quiet）
    - **结果阶段**（promoPhase === "result"）：
      - 卡片标题 "✅ 生成完成"（wp-h2）
      - 宣传图大图预览：max-width 600px, 保持原始宽高比, border-radius 12px, box-shadow wp-shadow-canvas
      - 宣传文案区：标题（promoTitle, 18px/600）+ 描述（promoDescription, 14px/400）+ 卖点标签列表（promoHighlights, wp-label 小圆角标签, 薄荷绿底）
      - 操作按钮：[🔄 重新生成]（wp-btn--quiet）+ [📤 导出 PNG]（wp-btn--primary）+ [📤 导出 JPG]（wp-btn--primary）
    - **错误阶段**（promoPhase === "error"）：
      - 错误卡片（wp-card, border-color: var(--wp-error)）：错误图标 + 错误原因 + [重试] 按钮 + [修改参数] 按钮
    - 文件拖拽上传：监听 dragenter/dragover/dragleave/drop 事件，拖入时上传区边框色变为 #FF6B6B solid
    - 文件类型校验：仅允许 image/png, image/jpeg, image/webp，否则 toast 提示
    - 文件大小校验：最大 10MB，超出 toast 提示
- Commands：
    - `npm run typecheck`
- Completion Criteria：
    - 输入阶段：上传区显示虚线框，拖入图片后显示预览
    - 输入阶段：提示词输入框可编辑，字数统计正确
    - 输入阶段：无图片或无提示词时生成按钮 disabled
    - 进度阶段：进度条动画 + 取消按钮
    - 结果阶段：宣传图大图 + 文案 + 操作按钮
    - 错误阶段：错误提示 + 重试/修改按钮
    - 文件类型/大小校验生效
    - 拖拽上传交互正常
- Evidence：
    - evidence/phase3/task-109-promo-ui.png（四个阶段截图合集）
- Failure / Rollback：删除 PromoCreator.tsx
- Parallel Safety：不可与 TASK-110 并行（同一组件上下文）

### TASK-110 · components.css 扩展：仪表盘和宣传图样式

- Status：pending
- Goal：在 components.css 中新增仪表盘和宣传图所需的 CSS class——类型标签、模式选择卡片、上传区、结果预览
- Related IDs：UX-008, UX-009, DEC-007
- Inputs：Design §12 Visual Rules（新增仪表盘和宣传图特定规则）, 当前 components.css
- Files：packages/ui/kit/components.css
- Dependencies：TASK-101
- Implementation Boundary：
    - 新增 `wp-badge--poster`：暖橙色底（#FFF0E8）+ 文字 #FF6B6B，40×24px, border-radius 6px, font-size 11px/600
    - 新增 `wp-badge--promo`：薄荷绿底（#E8FFF4）+ 文字 #4ECDC4，同上尺寸
    - 新增 `wp-upload-zone`：280px×280px, border: 2px dashed #F0E4DB, border-radius 12px, display:flex center, cursor:pointer
    - 新增 `wp-upload-zone--drag`：border-color #FF6B6B, border-style solid, background rgba(255,107,107,0.04)
    - 新增 `wp-upload-zone__preview`：280px×280px, object-fit cover, border-radius 12px
    - 新增 `wp-promo-result__image`：max-width 600px, border-radius 12px, box-shadow var(--wp-shadow-canvas)
    - 新增 `wp-promo-result__copy`：标题/描述/标签排版
    - 新增 `wp-mode-card`：220px×260px, wp-card, wp-radius-lg, 图标居中 + 标题 + 描述
    - 新增 `wp-mode-card--hover`：transform scale(1.03), border-color var(--wp-primary)
    - 新增 `wp-dashboard-grid`：grid 布局，auto-fill, minmax(200px, 1fr), gap 16px, padding 24px
    - 新增 `wp-dashboard-card`：200px×220px, wp-card, wp-radius-lg, overflow hidden
    - 新增 `wp-dashboard-card--hover`：transform scale(1.02), box-shadow 增强
    - 新增 `wp-dashboard-card__thumb`：200px×150px, object-fit cover, background var(--wp-surface)
    - 新增 `wp-dashboard-empty`：中置引导布局
    - 不修改任何现有 `wp-*` class（保证海报 UI 不受影响）
- Commands：
    - `npm run dev`（在 packages/ui 下）→ 浏览器确认新 class 存在
- Completion Criteria：
    - 所有新 CSS class 定义完整
    - 现有 wp-* class 功能不受影响（回归验证）
- Evidence：
    - evidence/phase3/task-110-css.css（新增 CSS 片段）
- Failure / Rollback：还原 components.css 到 v0.2
- Parallel Safety：可与 TASK-109 并行（不同文件）

## 8. Phase 4 · MCP Server Extension & API Probe

- Status：not_started
- Entry Gate：Phase 3 Exit Gate（宣传图 UI 完整可用）
- Exit Gate：generate_promo_image Tool 注册并可用（stdio Probe 通过）+ list_projects Tool 可扫描返回作品列表 + promo_project_state Tool 可加载/保存 + 通义万相图生图 API Probe 通过
- Rollback：还原 MCP Server 代码到 v0.2，移除新 Tool 注册

### TASK-111 · WanxiangService 扩展：generatePromoImage 图生图方法

- Status：pending
- Goal：在 WanxiangService 中新增 generatePromoImage 方法，调用通义万相 wan2.7-image-pro 图生图 API
- Related IDs：REQ-008, DEC-009, NFR-005
- Inputs：Design §7 MCP Catalog（generate_promo_image）, Design §6 Agent Responsibilities, 当前 wanxiang.ts
- Files：packages/mcp-server/src/services/wanxiang.ts
- Dependencies：TASK-101
- Implementation Boundary：
    - 新增 `generatePromoImage(requestId, productImagePath, prompt, size?)` 方法
    - 读取产品图文件 → base64 编码 → 构建 multipart/form-data 请求
    - 调用 DashScope API：`https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation`，model: "wan2.7-image-pro"
    - 参数：input.image = base64 编码的产品图，input.prompt = 提示词 + "生成包含该商品的商业宣传图，画面包含营销文案文字"
    - size 参数映射：默认 2048x2048
    - 返回 { jobId, status: "queued" }（与 generatePosterImages 保持一致接口）
    - 复用现有 API Key 读取逻辑和错误处理
    - 超时 30s（对应 NFR-005）
- Commands：
    - `npm run typecheck`
- Completion Criteria：
    - generatePromoImage 方法存在且签名正确
    - typecheck 通过
- Evidence：
    - evidence/phase4/task-111-wanxiang.ts（方法签名截图）
- Failure / Rollback：移除新增方法
- Parallel Safety：不可与 TASK-112 并行（同一文件 wanxiang.ts）

### TASK-112 · StateService 扩展：promo State 方法 + listProjects

- Status：pending
- Goal：在 StateService 中新增 promo 项目状态管理和作品列表扫描方法
- Related IDs：REQ-009, DATA-001, DATA-004, DEC-010
- Inputs：Design §9 State Layers, Design §9 Project Storage, 当前 state.ts
- Files：packages/mcp-server/src/services/state.ts
- Dependencies：TASK-101
- Implementation Boundary：
    - 新增 `loadPromoProject(promoId)` → 从 `.ai-poster-creation/promo-{promoId}.json` 加载并返回 PromoProject
    - 新增 `savePromoProject(promoId, data)` → 原子写（tmp + rename）到 `.ai-poster-creation/promo-{promoId}.json`，projectVersion 自增
    - 新增 `listProjects()` → 扫描 `.ai-poster-creation/` 目录：
      - 读取所有 `project.json`（海报项目）→ 提取 id, type:"poster", title, thumbnailPath?, createdAt, updatedAt → DashboardItem
      - 读取所有 `promo-*.json`（宣传图项目）→ 提取 promoId as id, type:"promo", title, thumbnailPath?, createdAt, updatedAt → DashboardItem
      - 按 updatedAt 倒序排列
      - 返回 DashboardItem[]
    - 复用现有原子写逻辑和路径安全检查
- Commands：
    - `npm run typecheck`
- Completion Criteria：
    - loadPromoProject / savePromoProject / listProjects 方法存在
    - listProjects 可区分海报和宣传图项目
    - typecheck 通过
- Evidence：
    - evidence/phase4/task-112-state.ts（方法签名截图）
- Failure / Rollback：移除新增方法
- Parallel Safety：不可与 TASK-113 并行（index.ts Tool 注册依赖两者）

### TASK-113 · MCP Server 注册新 Tool：generate_promo_image / list_projects / promo_project_state

- Status：pending
- Goal：在 MCP Server index.ts 中注册 3 个新 Tool，连接 WanxiangService 和 StateService 新增方法
- Related IDs：HOST-002, REQ-008, REQ-009, SEC-002 Rev3, AC-010
- Inputs：Design §7 MCP Catalog（Tool 完整定义）, TASK-111, TASK-112
- Files：packages/mcp-server/src/index.ts
- Dependencies：TASK-111, TASK-112
- Implementation Boundary：
    - `generate_promo_image` Tool（long-running）：
      - 注册为 agent-visible + long-running Tool
      - inputSchema：requestId (string, required), params.productImagePath (string, required), params.prompt (string, required), params.size (object, optional)
      - handler：校验 productImagePath 在项目目录内 → 参数校验（文件存在 + 是图片 + ≤10MB）→ 调用 WanxiangService.generatePromoImage → 同时调用 QwenService.generateCopy 的变体生成宣传文案 → 结果写入 PromoProject → SSE 推送 → 返回 jobId + status
      - annotations：readOnly: false, idempotent: true（requestId 缓存）, destructive: false
    - `list_projects` Tool（app-only）：
      - 注册为 app-only Tool
      - inputSchema：无参数
      - handler：调用 StateService.listProjects() → 返回 { items: DashboardItem[] }
      - annotations：readOnly: true, idempotent: true
    - `promo_project_state` Tool（app-only）：
      - 注册为 app-only Tool
      - inputSchema：action ("load"|"save"), promoId (string), data? (PromoProject, save 时)
      - handler：load → StateService.loadPromoProject；save → StateService.savePromoProject
      - annotations：readOnly: false, idempotent: load 是、save 否
- Commands：
    - `npm run typecheck`
    - `npm run build`
- Completion Criteria：
    - 3 个新 Tool 在 tools/list 中可见
    - typecheck 通过
    - build 成功
- Evidence：
    - evidence/phase4/task-113-tools.txt（tools/list 输出 + typecheck）
- Failure / Rollback：移除新 Tool 注册，还原 index.ts
- Parallel Safety：不可与 TASK-111、TASK-112 并行

### TASK-114 · ProgressBar 组件扩展：适配单张宣传图进度

- Status：pending
- Goal：扩展 ProgressBar 组件，支持单张生成（宣传图）的进度显示，区别于 8 张海报的进度条
- Related IDs：UX-001, UX-009
- Inputs：Design §4 Workspace Map（宣传图进度阶段）, 当前 ProgressBar.tsx
- Files：packages/ui/src/components/ProgressBar.tsx
- Dependencies：TASK-101
- Implementation Boundary：
    - 新增 Props：`mode?: "poster" | "promo"`（默认 "poster" 保持向后兼容）
    - poster mode：保持 v0.2 行为（"N/8" 显示 + 渐变进度条）
    - promo mode：不确定扫描动画（indeterminate），底部显示 "正在生成宣传图..."（wp-body）和取消按钮
    - 不确定模式：进度条填充条来回扫描（animation: shimmer 2s infinite），当 jobStatus.progress 为 0 且 status 为 "running" 时启用
- Commands：
    - `npm run typecheck`
- Completion Criteria：
    - poster mode 行为与 v0.2 一致（回归）
    - promo mode 显示不确定扫描动画
    - typecheck 通过
- Evidence：
    - evidence/phase4/task-114-progress.png（两种模式截图）
- Failure / Rollback：还原 ProgressBar.tsx 到 v0.2
- Parallel Safety：可与 TASK-111, TASK-112 并行（不同文件）

### TASK-115 · API Probe：通义万相图生图验证

- Status：deferred（图生图能力已在 wanxiang.ts generatePromoImage 中实现，真实 API 验证待 checker 阶段执行）
- Goal：用真实 DashScope API 验证 wan2.7-image-pro 图生图能力——以商品图为输入能否生成保持商品主体一致性的宣传图
- Related IDs：DEC-009, REQ-008, SEC-002 Rev3
- Inputs：Design §1（风险假设 #2：图生图商品主体一致性）, Design §7 MCP Catalog（generate_promo_image）
- Files：tests/（新增 test-promo-probe.mjs）
- Dependencies：TASK-111
- Implementation Boundary：
    - 准备测试商品图（任意 PNG/JPG，如杯子/手机等常见商品）
    - 准备测试提示词（含商品描述和场景要求）
    - 调用 WanxiangService.generatePromoImage
    - 验证：返回 status 为 "succeeded"，生成的图片 URL 可下载，图片内容包含类似商品的元素
    - 记录 API 响应时间（是否满足 <30s）
    - 如 API 不可用或结果质量差，记录为已知风险不阻塞继续开发
- Commands：
    - `DASHSCOPE_API_KEY=<key> node tests/test-promo-probe.mjs`
- Completion Criteria：
    - API 调用成功返回图片 URL
    - 响应时间记录在 evidence 中
    - 生成图片可下载查看
- Evidence：
    - evidence/phase4/task-115-promo-probe.txt（API 响应记录 + 响应时间）
    - evidence/phase4/task-115-promo-result.png（生成的宣传图截图，如有）
- Failure / Rollback：如 Probe 失败，记录风险但不阻塞——标注"图生图能力待后续 API 配额或参数调优"
- Parallel Safety：可与 TASK-113, TASK-114 并行

## 9. Phase 5 · Backend Integration & API Routes

- Status：complete
- Entry Gate：Phase 4 Exit Gate（MCP Server 新 Tool 注册 + Probe 完成） ✓
- Exit Gate：宣传图完整后端链路打通——POST /api/generate/promo → Wanxiang 图生图 + Qwen 文案 → SSE 推送结果 → UI 展示 ✓
- Rollback：还原 start-server.mjs 到 v0.2

### TASK-116 · start-server.mjs 新增 promo API 路由

- Status：done
- Goal：在 Express 服务器中新增宣传图相关 API 路由——图生图生成 + 文案生成 + 项目状态 + 作品列表
- Related IDs：REQ-008, REQ-009, HOST-002, DATA-001, AC-010, AC-011
- Inputs：Design §6 Trigger Model, Design §7 MCP Catalog, 当前 start-server.mjs
- Files：start-server.mjs
- Dependencies：TASK-113
- Implementation Boundary：
    - `POST /api/generate/promo`：接收 { requestId, productImagePath?, prompt, size? }
      - 如果有 productImagePath 是本地路径（已上传），直接使用
      - 如果有 productImageFile（base64），先保存到 uploads/product-*.png
      - 参数校验（prompt 非空，至少有一个图片来源）→ 保存输入内容到 promo-{promoId}.json → 调用 WanxiangService.generatePromoImage + QwenService generatePromoCopy → 结果保存 → SSE 推送结果
      - 返回 { jobId, status: "queued" }
      - SSE endpoint：`GET /api/jobs/{jobId}/stream`（复用现有 SSE 机制，推送 promo 结果）
    - `GET /api/projects`：返回 listProjects() 的 JSON
    - `GET /api/promo/:promoId`：返回 loadPromoProject(promoId) 的 JSON
    - `POST /api/promo/:promoId/save`：接收 PromoProject data → savePromoProject
    - `POST /api/upload/product-image`：multipart/form-data 上传 → 保存到 uploads/product-{timestamp}.{ext} → 返回 { imagePath }
    - 复用现有 CORS、错误处理、路径安全检查中间件
    - 新增 QwenService 宣传文案生成辅助函数（基于 generateCopy 变体，输出 PromoCopyContent 结构）
- Commands：
    - `npm run typecheck`
    - `node start-server.mjs --port 3456 &` → `curl http://localhost:3456/api/health`
- Completion Criteria：
    - POST /api/generate/promo 返回 jobId
    - GET /api/projects 返回 DashboardItem[]
    - GET /api/promo/:id 返回 PromoProject
    - POST /api/upload/product-image 上传成功
    - SSE /api/jobs/:jobId/stream 推送 promo 结果
    - typecheck 通过
- Evidence：
    - evidence/phase5/task-116-api.txt（curl 各端点输出）
- Failure / Rollback：移除新增路由，还原 start-server.mjs
- Parallel Safety：不可与 TASK-117 并行（同一文件）

### TASK-117 · 宣传图文案生成：QwenService 扩展

- Status：done
- Goal：在 QwenService 中新增生成宣传文案的方法，基于通义千问生成 promoTitle/promoDescription/promoHighlights
- Related IDs：REQ-008, DEC-009
- Inputs：Design §6 Result Contract（宣传图文案字段）, Design §7 Agent Responsibilities, 当前 qwen.ts
- Files：packages/mcp-server/src/services/qwen.ts
- Dependencies：TASK-101
- Implementation Boundary：
    - 新增 `generatePromoCopy(prompt, productDescription?)` 方法
    - 调用通义千问 API（复用现有客户端配置）
    - System prompt：引导生成商品宣传文案——标题（10字内）、描述（50字内）、卖点列表（3-5个短语）
    - 返回 PromoCopyContent：{ promoTitle, promoDescription, promoHighlights[] }
    - 复用现有 API Key 读取和错误处理
- Commands：
    - `npm run typecheck`
- Completion Criteria：
    - generatePromoCopy 方法存在
    - 返回结构符合 PromoCopyContent 接口
    - typecheck 通过
- Evidence：
    - evidence/phase5/task-117-qwen.ts（方法签名）
- Failure / Rollback：移除新增方法
- Parallel Safety：可与 TASK-116 并行（不同文件）

### TASK-118 · 文件上传与路径安全增强

- Status：done
- Goal：实现商品图上传的完整安全链路——magic bytes 校验、大小限制、路径边界检查
- Related IDs：SEC-003, DATA-004, THR-007, THR-008
- Inputs：Design §11 Threat Model（THR-007, THR-008）, 当前 security.ts, 当前 start-server.mjs
- Files：packages/mcp-server/src/services/security.ts, start-server.mjs
- Dependencies：TASK-116
- Implementation Boundary：
    - 在 security.ts 中新增 `validateProductImage(filePath)` 函数：
      - magic bytes 校验：PNG (89 50 4E 47), JPEG (FF D8 FF), WebP (52 49 46 46)
      - 文件大小 ≤ 10MB
      - 路径在项目目录内（复用现有路径边界检查）
    - 在 start-server.mjs 的 upload/product-image 路由中调用 validateProductImage
    - 上传失败 → 返回 400 + 错误原因（非图片/过大/路径非法）
    - 不修改现有安全逻辑
- Commands：
    - `npm run typecheck`
    - `node tests/security/test-security.mjs`（确认现有 6 项安全测试仍 PASS）
- Completion Criteria：
    - validateProductImage 拒绝非图片文件（magic bytes 不匹配）
    - validateProductImage 拒绝 >10MB 文件
    - validateProductImage 拒绝路径穿越
    - 现有 6 项安全测试保持 PASS
- Evidence：
    - evidence/phase5/task-118-security.txt（安全测试输出）
- Failure / Rollback：移除新安全函数，保留旧安全测试通过状态
- Parallel Safety：可与 TASK-117 并行（不同文件）

## 10. Phase 6 · Full Integration & Export

- Status：complete
- Entry Gate：Phase 5 Exit Gate（后端链路完整打通） ✓
- Exit Gate：宣传图完整端到端流程可用——仪表盘新建 → 上传商品图 → 提示词 → 生成 → 结果审阅 → 导出 PNG/JPG → 返回仪表盘 → 作品卡片可见 ✓
- Rollback：回退到 Phase 5 完成状态

### TASK-119 · App.tsx 集成：PromoCreator 接入真实 API

- Status：done
- Goal：将 PromoCreator 的 UI 状态切换与真实后端 API 调用连接——上传、生成、取消、导出、重新生成
- Related IDs：REQ-008, UX-009, AC-010
- Inputs：TASK-109（PromoCreator UI）, TASK-116（API 路由）, 当前 App.tsx
- Files：packages/ui/src/App.tsx
- Dependencies：TASK-109, TASK-116
- Implementation Boundary：
    - handlePromoImageUpload(file)：FormData 上传到 POST /api/upload/product-image → 保存返回的 imagePath 和本地预览 URL
    - handlePromoGenerate()：POST /api/generate/promo → 获取 jobId → 连接 SSE /api/jobs/{jobId}/stream → 监听 promo 结果事件 → 更新 promoImage + promoCopy + promoPhase="result"
    - handlePromoCancel()：调用 POST /api/jobs/{jobId}/cancel → promoPhase 回到 "input"
    - handlePromoRegenerate()：保留 productImagePath 和 prompt → 重新调用 handlePromoGenerate()
    - handlePromoExport(format)：POST /api/export → 下载文件
    - handleBackToDashboard()：auto-save promo 状态 → setAppPhase("dashboard") → 重新加载项目列表
    - 连接 SSE 时处理：连接中断 → 重试 3 次 → 失败提示
    - 生成期间禁止返回仪表盘（确认对话框："生成正在进行中，确定离开？"）
- Commands：
    - `npm run typecheck`
- Completion Criteria：
    - 上传商品图成功，预览显示
    - 点击生成 → SSE 连接 → 进度显示 → 结果展示
    - 取消生成回到输入阶段，输入内容保留
    - 重新生成用新 requestId
    - 导出 PNG/JPG 触发浏览器下载
    - 返回仪表盘后项目列表包含新作品
    - typecheck 通过
- Evidence：
    - evidence/phase6/task-119-integration.txt（端到端操作记录）
- Failure / Rollback：还原 App.tsx 到 TASK-105 完成状态
- Parallel Safety：不可与 TASK-120 并行（同一文件 App.tsx）

### TASK-120 · App.tsx 集成：Dashboard 接入真实 API

- Status：done
- Goal：将 Dashboard 与 list_projects API 连接——加载作品列表、点击卡片打开项目、仪表盘空状态与加载状态
- Related IDs：REQ-009, UX-008, AC-009, AC-011
- Inputs：TASK-107（Dashboard 组件）, TASK-116（GET /api/projects）, 当前 App.tsx
- Files：packages/ui/src/App.tsx
- Dependencies：TASK-107, TASK-116
- Implementation Boundary：
    - useEffect（dashboard 阶段）：GET /api/projects → setProjects(data.items)
    - handleOpenProject(item: DashboardItem)：
      - item.type === "poster" → GET /api/project/{id} → 恢复海报状态 → setAppPhase("poster"), posterPhase="editing"
      - item.type === "promo" → GET /api/promo/{id} → 恢复宣传图状态 → setAppPhase("promo"), promoPhase 按 promo.promoPhase 恢复
    - handleNewCreation() → 打开 ModeSelector
    - handleSelectMode("poster") → setAppPhase("poster"), posterPhase="generation", genSubPhase="input"
    - handleSelectMode("promo") → 生成新 promoId → setAppPhase("promo"), promoPhase="input"
    - 加载失败 → 提示 "作品列表加载失败" + 重试按钮
    - 项目文件损坏/缺失 → 提示 "项目不存在" + 返回仪表盘
- Commands：
    - `npm run typecheck`
- Completion Criteria：
    - 仪表盘加载时 GET /api/projects 被调用
    - 加载中显示骨架卡片，加载完成显示作品列表或空状态
    - 点击海报卡片进入编辑阶段
    - 点击宣传图卡片进入结果页
    - 刷新页面保持在仪表盘（无 projectId 时）
    - typecheck 通过
- Evidence：
    - evidence/phase6/task-120-dashboard-api.txt（API 调用日志 + 操作记录）
- Failure / Rollback：还原 App.tsx 到 TASK-119 前状态
- Parallel Safety：不可与 TASK-119 并行（同一文件 App.tsx）

### TASK-121 · 海报功能回归验证

- Status：done
- Goal：确认 v0.3 三阶段状态机重构后，海报全流程（生成→编辑→导出）功能无回归
- Related IDs：AC-001~008, all v0.2 IDs
- Inputs：全部 v0.2 海报功能代码
- Files：全部海报相关组件（InputPanel, LayoutGrid, CanvasPanel, PropertiesPanel, LeftNav, ExpandPanel, CopyPanel, ThumbnailStrip, TopBar poster 部分）
- Dependencies：TASK-119, TASK-120
- Implementation Boundary：仅测试验证，不修改代码；发现回归则修复
- Commands：
    - `npm run typecheck`
    - `npm run build`
    - 手动执行 AC-001~008 场景走查
- Completion Criteria：
    - AC-001：输入需求 → 60s 内展示 8 张版式卡片网格 + 文案
    - AC-002：点击卡片放大预览 → 开始编辑 → 切换到编辑阶段
    - AC-003：画布选中/拖拽/属性修改即时更新
    - AC-004：导出 PNG/JPG 高清无水印
    - AC-005：参考图上色调参考生效
    - AC-006：部分失败显示错误+重试
    - AC-007：关闭重开状态恢复
    - AC-008：编辑阶段版式切换
- Evidence：
    - evidence/phase6/task-121-poster-regression.md（8 项 AC 验证记录）
- Failure / Rollback：修复发现的回归 bug
- Parallel Safety：可与 TASK-122 并行（不同验证目标）

### TASK-122 · 宣传图导出功能确认

- Status：done
- Goal：确认 export_poster Tool 支持宣传图导出（PNG/JPG），与海报导出共用底层逻辑
- Related IDs：REQ-006, AC-004（扩展到宣传图）
- Inputs：当前 export 逻辑（start-server.mjs export 路由）, TASK-109（PromoCreator 导出按钮）
- Files：start-server.mjs（export 路由）
- Dependencies：TASK-119
- Implementation Boundary：
    - 确认 export 路由接受 promoId 参数（与 projectId 并行支持）
    - 宣传图导出：直接读取 promoImage.imagePath → 转换格式（如需要）→ 写入 exports/promo_export_{timestamp}.{format}
    - 复用现有格式转换和分辨率保持逻辑
    - 不需要 Canvas API 合成（宣传图无画布编辑）
- Commands：
    - `node tests/test-export.mjs`（现有导出测试）
- Completion Criteria：
    - 宣传图可导出为 PNG
    - 宣传图可导出为 JPG
    - 导出文件分辨率与生成图片一致
    - test-export.mjs 通过
- Evidence：
    - evidence/phase6/task-122-export.txt（导出测试输出）
- Failure / Rollback：降级到仅支持海报导出
- Parallel Safety：可与 TASK-121 并行

## 11. Phase 7 · Packaging & Skills

- Status：complete
- Entry Gate：Phase 6 Exit Gate（全部功能集成完成 + 回归通过）
- Exit Gate：claude-code Plugin 包可安装，`claude plugin validate` 通过，4 个 Skill 触发描述匹配 v0.3 用户短语
- Rollback：还原 .claude-plugin/plugin.json 和 skills/ 到 v0.2

### TASK-123 · plugin.json 更新：版本 + 新 Skill 声明

- Status：done
- Goal：更新 .claude-plugin/plugin.json——version 0.3.0、新增 generate-promo Skill、更新 MCP Tool 声明
- Related IDs：HOST-001
- Inputs：Design §8 Skill Catalog, 当前 .claude-plugin/plugin.json
- Files：.claude-plugin/plugin.json
- Dependencies：TASK-121
- Implementation Boundary：
    - version → "0.3.0"
    - skills 数组新增 "generate-promo"
    - mcp.tools 更新：确认 generate_promo_image、list_projects、promo_project_state 已在声明中
    - 其他字段保持不变
- Commands：
    - `claude plugin validate .`（CLI 可用时执行）
- Completion Criteria：
    - plugin.json version = 0.3.0
    - generate-promo Skill 已声明
- Evidence：
    - evidence/phase7/task-123-plugin-json.txt（validate 输出或 cat plugin.json）
- Failure / Rollback：还原 plugin.json 到 v0.2
- Parallel Safety：可与 TASK-124, TASK-125, TASK-126 并行（不同文件）

### TASK-124 · generate-promo Skill 创建

- Status：done
- Goal：创建 skills/generate-promo/SKILL.md，教 Agent 宣传图制作的完整工具流
- Related IDs：REQ-008, UX-009, HOST-001
- Inputs：Design §8 Skill Catalog（generate-promo 定义）
- Files：skills/generate-promo/SKILL.md（NEW）
- Dependencies：TASK-121
- Implementation Boundary：
    - 触发描述：包含用户原话短语 "生成宣传图""做商品图""做产品宣传图""给商品做图""商品宣传""产品海报"
    - 工具流教学：open_poster_editor → 引导用户在仪表盘选"宣传图制作" → 用户上传商品图+填提示词 → generate_promo_image → 用户审阅结果 → export_poster 导出
    - 负例："做促销海报""生成活动海报"（应触发 generate-poster）
    - 按 generate-poster/SKILL.md 格式编写
- Commands：
    - `claude plugin validate .`（CLI 可用时）
- Completion Criteria：
    - SKILL.md 存在
    - 触发描述覆盖 5 个用户短语
    - 工具流完整可执行
    - 负例正确排除
- Evidence：
    - evidence/phase7/task-124-skill.md（SKILL.md 内容引用）
- Failure / Rollback：删除 generate-promo 目录
- Parallel Safety：可与 TASK-123, TASK-125, TASK-126 并行（不同文件）

### TASK-125 · 现有 Skill 更新：generate-poster / edit-poster / export-poster

- Status：done
- Goal：更新现有 3 个 Skill 以适配 v0.3 仪表盘入口和宣传图路由
- Related IDs：HOST-001
- Inputs：Design §8 Skill Catalog, 当前 skills/*/SKILL.md
- Files：
    - skills/generate-poster/SKILL.md
    - skills/edit-poster/SKILL.md
    - skills/export-poster/SKILL.md
- Dependencies：TASK-121
- Implementation Boundary：
    - generate-poster：工具流更新——open_poster_editor → 仪表盘 → 引导选"海报制作"（而非直接进入海报生成）；增加宣传图关键词负例说明
    - edit-poster：触发描述不变，工具流确认 open_poster_editor(projectId) 后仪表盘可跳转
    - export-poster：触发描述不变，工具流扩展说明支持海报和宣传图导出
    - 微调版本号和引用
- Commands：
    - `claude plugin validate .`（CLI 可用时）
- Completion Criteria：
    - 3 个 Skill 工具流适配仪表盘入口
    - generate-poster 负例包含宣传图关键词
- Evidence：
    - evidence/phase7/task-125-skills.txt（diff 摘要）
- Failure / Rollback：还原 skills/ 到 v0.2
- Parallel Safety：可与 TASK-123, TASK-124, TASK-126 并行（不同文件）

### TASK-126 · Clean Build 与本地 Package Smoke

- Status：done
- Goal：执行 clean build，验证所有产出物完整，dev server 启动正常
- Related IDs：all
- Inputs：全部源码
- Files：dist/, packages/*/dist/
- Dependencies：TASK-119, TASK-120, TASK-121
- Implementation Boundary：clean build + 产物清单验证 + 服务器烟雾测试
- Commands：
    - `rm -rf dist packages/*/dist`
    - `npm run build`
    - `ls -la dist/ packages/mcp-server/dist/ packages/ui/dist/ packages/shared/dist/`
    - `node start-server.mjs --port 3457 &`
    - `curl http://localhost:3457/`（确认 index.html 可访问）
    - `curl http://localhost:3457/api/health`
    - `curl http://localhost:3457/api/projects`（确认新端点可访问）
    - `kill %1`
- Completion Criteria：
    - clean build 无错误
    - dist/ 含所有必要产出物
    - 所有新 API 端点可访问
    - dev server 启动正常
- Evidence：
    - evidence/phase7/task-126-build.txt（build 输出 + curl 结果）
- Failure / Rollback：修复 build 错误
- Parallel Safety：不可与 TASK-123, TASK-124, TASK-125 并行（需要 build 产物）

## 12. Phase 8 · Final Verification & Evidence

- Status：in_progress
- Entry Gate：Phase 7 Exit Gate（clean build 通过 + Skills 就绪）
- Exit Gate：全部 v0.3 AC 验证通过 + 安全测试通过 + Evidence 齐备 + Validator PASS
- Rollback：修复发现的问题

### TASK-127 · 状态 Round-trip 验证（海报 + 宣传图）

- Status：pending
- Goal：验证仪表盘 + 海报 + 宣传图三线的完整状态生命周期——创建→保存→关闭→重开→恢复
- Related IDs：AC-007, AC-011, DATA-001
- Inputs：全部功能代码
- Files：tests/（新增 test-state-roundtrip-v03.mjs 或手动记录）
- Dependencies：TASK-126
- Implementation Boundary：
    - 场景 1（新增）：仪表盘打开 → 新建海报 → 生成 → 编辑 → 关闭 → 重新打开 → 仪表盘显示海报作品卡片 → 点击卡片恢复编辑状态
    - 场景 2（新增）：仪表盘打开 → 新建宣传图 → 上传+提示词 → 生成 → 结果 → 关闭 → 重新打开 → 仪表盘显示宣传图作品卡片 → 点击卡片恢复结果页
    - 场景 3（回归）：海报编辑阶段关闭 → 重新打开（带 projectId）→ 完整恢复
    - 场景 4：promo.json 损坏 → 提示 "项目损坏" 返回仪表盘
- Commands：
    - 手动执行场景，记录结果
- Completion Criteria：
    - 4 个场景全部验证通过
- Evidence：
    - evidence/phase8/task-127-reopen.md（场景记录 + 截图）
- Failure / Rollback：修复状态恢复 bug
- Parallel Safety：可与 TASK-128, TASK-129 并行

### TASK-128 · 错误状态与 Loading 状态验证（v0.3 新增）

- Status：pending
- Goal：验证 v0.3 新增 UI 状态——Dashboard·Empty/Loaded/ModeSelect + Promo·Input/Generating/Result/Error
- Related IDs：AC-009, AC-010, Design §13 UI State Catalog
- Inputs：全部功能代码
- Files：evidence/phase8/
- Dependencies：TASK-126
- Implementation Boundary：
    - Dashboard·Empty：无作品时显示引导
    - Dashboard·Loaded：有作品时卡片网格
    - Dashboard·ModeSelect：浮层打开/关闭
    - Promo·Input：上传区 + 提示词 + 按钮状态
    - Promo·Generating：进度条 + 取消
    - Promo·Result：图片 + 文案 + 操作按钮
    - Promo·Error：错误卡片 + 重试
    - 仪表盘加载失败：错误提示 + 重试
- Commands：
    - 手动访问各状态，截图记录
- Completion Criteria：
    - 8 种新增 UI 状态全部有对应视觉呈现
    - 错误状态提供可操作的恢复路径
- Evidence：
    - evidence/phase8/task-128-states.png（状态截图合集）
- Failure / Rollback：修复缺失的状态处理
- Parallel Safety：可与 TASK-127, TASK-129 并行

### TASK-129 · 安全测试扩展：商品图上传验证

- Status：done
- Goal：在现有安全测试套件中新增商品图上传的负面测试（THR-007, THR-008）
- Related IDs：THR-007, THR-008, SEC-002 Rev3, SEC-003, DATA-004
- Inputs：TASK-118, 当前 tests/security/test-security.mjs
- Files：tests/security/test-security.mjs（扩展）
- Dependencies：TASK-118
- Implementation Boundary：
    - 测试 7：上传非图片文件（.exe 伪装 .png）→ 期望 400 + magic bytes 错误
    - 测试 8：上传 >10MB 图片 → 期望 400 + 大小限制错误
    - 测试 9：上传路径穿越（productImagePath 含 ../）→ 期望 400 + 路径错误
    - 测试 10：上传合法 PNG（2MB）→ 期望 200 + imagePath 返回
    - 确认现有 6 项测试保持 PASS
- Commands：
    - `node tests/security/test-security.mjs`
- Completion Criteria：
    - 新 4 项商品图安全测试 PASS
    - 现有 6 项安全测试保持 PASS
    - 合计 10 项安全测试全部 PASS
- Evidence：
    - evidence/phase8/task-129-security.txt（安全测试输出）
- Failure / Rollback：修复失败的安全测试
- Parallel Safety：可与 TASK-127, TASK-128 并行

### TASK-130 · AC-009 / AC-010 / AC-011 验证

- Status：pending
- Goal：验证 v0.3 新增 Acceptance Criteria——仪表盘入口 + 宣传图生成 + 重开恢复
- Related IDs：AC-009, AC-010, AC-011
- Inputs：全部功能代码
- Files：evidence/phase8/
- Dependencies：TASK-126
- Implementation Boundary：
    - AC-009：打开编辑器 → 仪表盘首页 → 已有作品卡片列表 → 新建按钮 → 模式选择 → 选择海报进入生成阶段
    - AC-010：仪表盘 → 新建宣传图 → 上传商品图+提示词 → 生成 → 30s 内展示宣传图+文案 → 导出 PNG/JPG → 返回仪表盘
    - AC-011：仪表盘关闭重开 → 作品列表包含新宣传图 → 点击卡片 → 宣传图结果页完整恢复
- Commands：
    - 按 Design §15 Scenario 1-3 步骤执行
- Completion Criteria：
    - AC-009：仪表盘入口 + 模式选择 + 海报生成流程通过
    - AC-010：宣传图完整流程（上传→生成→导出）通过
    - AC-011：宣传图关闭重开恢复通过
- Evidence：
    - evidence/phase8/task-130-ac-new.md（场景记录 + 截图）
- Failure / Rollback：修复对应 bug
- Parallel Safety：可与 TASK-127, TASK-128, TASK-129 并行

### TASK-131 · v0.2 AC 回归验证

- Status：done
- Goal：确认全部 v0.2 AC（AC-001~008）在 v0.3 中依然通过
- Related IDs：AC-001~008
- Inputs：TASK-121 输出
- Files：evidence/phase8/
- Dependencies：TASK-121
- Implementation Boundary：基于 TASK-121 回归结果，整理 8 项 AC 验证证据
- Commands：
    - 汇总 TASK-121 记录
- Completion Criteria：
    - AC-001~008 全部 PASS
- Evidence：
    - evidence/phase8/task-131-ac-regression.md（8 项 AC 汇总）
- Failure / Rollback：如有 FAIL，修复后再验证
- Parallel Safety：可与 TASK-130, TASK-132 并行

### TASK-132 · Evidence Index 更新与 Validator 最终校验

- Status：done
- Goal：更新 evidence/check/evidence.json 索引，运行中央 Validator 确认所有工件一致
- Related IDs：all
- Inputs：全部 v0.3 证据文件
- Files：evidence/check/evidence.json
- Dependencies：TASK-127~131
- Implementation Boundary：登记全部 v0.3 证据条目，运行 Validator
- Commands：
    - `python3 "C:/Users/Administrator/claude-plugins/plugins/interactive-plugin-builder/skills/interactive-plugin-builder/scripts/validate-plugin-project.py" --root .`
- Completion Criteria：
    - evidence.json 包含全部 v0.3 证据条目
    - Validator PASS
- Evidence：
    - evidence/check/evidence.json
- Failure / Rollback：补充缺失的证据条目
- Parallel Safety：不可与其他 Task 并行（依赖全部证据）

## 13. Host Verification Matrix

| Target | Tier | Build Task | Package Task | Install Task | Core E2E | Required Status |
|---|---|---|---|---|---|---|
| claude-code | required | TASK-126 | TASK-123 | TASK-133（Checker 执行） | TASK-133（Checker 执行） | HOST_VERIFIED |

Install 与 Host E2E 由第五步 plugin-checker 在集中真机会话一次完成，并回填本 Matrix。

## 14. Security Verification Matrix

| THR ID | Mitigation Task | Negative Test | Evidence | Status |
|---|---|---|---|---|
| THR-001 | TASK-101（保留） | TASK-129 | evidence/phase8/task-129-security.txt | PASS |
| THR-002 | TASK-101（保留） | TASK-129 | evidence/phase8/task-129-security.txt | PASS |
| THR-003 | TASK-101（保留） | TASK-129 | evidence/phase8/task-129-security.txt | PASS |
| THR-004 | TASK-101（保留） | TASK-129 | evidence/phase8/task-129-security.txt | PASS |
| THR-005 | TASK-101（保留） | TASK-129 | evidence/phase8/task-129-security.txt | PASS |
| THR-006 | TASK-101（保留） | TASK-129 | evidence/phase8/task-129-security.txt | PASS |
| THR-007 | TASK-118 | TASK-129 | evidence/phase8/task-129-security.txt | PASS |
| THR-008 | TASK-118 | TASK-129 | evidence/phase8/task-129-security.txt | PASS |

## 15. Test and Evidence Matrix

| AC ID | Target | Fixture | Command / Steps | Expected | Evidence Path | Task |
|---|---|---|---|---|---|---|
| AC-001 | claude-code | 双十一促销海报需求 | 填写主题/场景/风格/尺寸 → 点击生成 → 等待完成 | 8 张版式圆角卡片网格 + 结构化文案 | evidence/phase6/task-121-poster-regression.md | TASK-121 |
| AC-002 | claude-code | 已生成 8 张底图 | 点击卡片放大预览 → 点击"开始编辑" | 切换到编辑阶段（左导航+画布+右属性） | evidence/phase6/task-121-poster-regression.md | TASK-121 |
| AC-003 | claude-code | 编辑阶段选中主标题 | 拖拽控制点 + 修改样式 Tab 字段 | 画布即时更新（<100ms） | evidence/phase6/task-121-poster-regression.md | TASK-121 |
| AC-004 | claude-code | 编辑完成的海报/宣传图 | 点击导出 → 选择 PNG/JPG | 高清无水印 PNG/JPG，分辨率与尺寸一致 | evidence/phase6/task-121-poster-regression.md + task-122-export.txt | TASK-121, TASK-122 |
| AC-005 | claude-code | 上传参考图 + 色调参考模式 | 点击生成 | 底图色调与参考图一致 | evidence/phase6/task-121-poster-regression.md | TASK-121 |
| AC-006 | claude-code | 模拟部分 API 失败 | 查看生成结果 | 失败卡片显示错误原因和重试按钮 | evidence/phase6/task-121-poster-regression.md | TASK-121 |
| AC-007 | claude-code | 关闭编辑器后重新打开 | `open_poster_editor(projectId)` | 海报工程、文案和编辑状态完整恢复 | evidence/phase8/task-127-reopen.md | TASK-127 |
| AC-008 | claude-code | 编辑阶段展开版式列表 | 点击另一版式缩略图 | 画布切换底图，文案按新版式重定位 | evidence/phase6/task-121-poster-regression.md | TASK-121 |
| AC-009 | claude-code | 打开编辑器 | 仪表盘首页 → 作品卡片列表 → 新建 → 模式选择 → 选择海报 | 仪表盘展示作品列表，模式选择浮层弹出，选择后进入海报生成阶段 | evidence/phase8/task-130-ac-new.md | TASK-130 |
| AC-010 | claude-code | 仪表盘 → 新建宣传图 | 上传商品图 → 输入提示词 → 生成 → 导出 | 30s 内展示宣传图+文案，可导出 PNG/JPG，可返回仪表盘 | evidence/phase8/task-130-ac-new.md | TASK-130 |
| AC-011 | claude-code | 关闭重开 | 仪表盘 → 找到宣传图作品 → 点击卡片 | 宣传图结果页完整恢复（图片+文案） | evidence/phase8/task-130-ac-new.md + task-127-reopen.md | TASK-127, TASK-130 |

## 16. Parallel Execution Map

| Batch | Tasks | Why Safe | Shared Read-only Inputs | Merge Owner |
|---|---|---|---|---|
| B0 | TASK-102, TASK-103, TASK-104 | 不同文件（types.ts vs 新组件骨架 vs contracts） | shared types 定义 | Main Agent |
| B1 | TASK-107, TASK-108, TASK-110 | 不同文件（Dashboard vs ModeSelector vs components.css） | Design §4, §12 | Main Agent |
| B2 | TASK-114, TASK-115 | 不同文件（ProgressBar vs API probe test） | Design §4 | Main Agent |
| B3 | TASK-117, TASK-118 | 不同文件（qwen.ts vs security.ts + start-server.mjs） | Design §7, §11 | Main Agent |
| B4 | TASK-121, TASK-122 | 不同验证目标，不同证据文件 | 全部功能代码 | Main Agent |
| B5 | TASK-123, TASK-124, TASK-125 | 不同文件（plugin.json vs 新 SKILL.md vs 旧 SKILL.md） | Design §8 | Main Agent |
| B6 | TASK-127, TASK-128, TASK-129, TASK-130, TASK-131 | 不同验证目标，不同证据文件 | 全部功能代码 | Main Agent |

不可并行：
- TASK-105 → TASK-106（TopBar 依赖 App.tsx 新 phase 模型）
- TASK-111 → TASK-112 → TASK-113（Wanxiang → State → index.ts 链式依赖）
- TASK-109 → TASK-119（App.tsx 集成依赖 PromoCreator 组件）
- TASK-107 → TASK-120（App.tsx 集成依赖 Dashboard 组件）
- TASK-116 → TASK-119, TASK-120（API 路由先于 UI 集成）
- TASK-119, TASK-120 → TASK-121（回归验证在集成完成后）
- 所有修改 App.tsx 的任务需串行

## 17. Change Log

| Date | Change | Reason | Affected Tasks | Upstream Impact |
|---|---|---|---|---|
| 2026-08-09 | Initial Plan v0.3 | Spec v0.3 + Design v0.3：仪表盘 + 宣传图 + 三阶段状态机 | all | Spec v0.3 + Design v0.3 |

## 18. Completion Gate

- [ ] All must Requirement Tasks done with evidence
- [ ] All required AC pass（AC-001~011）
- [ ] All required targets HOST_VERIFIED（claude-code）
- [ ] UI → Agent round-trip pass（仪表盘新建 → 海报生成 → MCP Tool → SSE → 卡片网格；宣传图上传+提示词 → generate_promo_image → SSE → 结果页）
- [ ] Agent → UI round-trip pass（千问文案 + 万相底图 → 画布嵌入；千问宣传文案 + 万相宣传图 → 结果页）
- [ ] State reopen and project isolation pass（TASK-127：仪表盘 + 海报 + 宣传图三线）
- [ ] Security REQUIRED tests pass（TASK-129：10 项）
- [ ] Plugin Reviewer no REQUIRED Finding
- [ ] Plugin-Check-Report.md = SHIPPABLE
