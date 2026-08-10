# Plugin Spec Changelog

## 2026-08-09 · v0.3 新增商品宣传图 + 仪表盘

- Spec Version：0.3.0
- Change Type：Scope Add + Behavior Change
- Reason：用户要求在现有海报制作功能基础上，新增商品宣传图制作（上传商品图 + 提示词 → AI 生成商品宣传图 + 宣传文案），同时新增仪表盘首页作为统一入口（作品列表 + 新建按钮 + 模式选择）
- Added IDs：REQ-008（商品宣传图生成）、REQ-009（作品管理仪表盘）、UX-008（仪表盘首页）、UX-009（宣传图生成流程）、DATA-004（商品图上传）、NFR-005（宣传图生成响应）、AC-009~011
- Modified IDs：SEC-002（Rev3：扩展域名范围覆盖通义万相图生图 API 端点）、AC-001/007（更新描述适配仪表盘入口）
- Superseded / Deferred IDs：none
- Design Impact：重大 — 需新增仪表盘页面设计、宣传图生成流程设计、模式选择交互、三阶段状态机（仪表盘 → 海报生成/编辑 或 仪表盘 → 宣传图生成）、作品列表数据模型
- Plan Impact：重大 — 需新增仪表盘相关 Task（组件、数据、路由）、宣传图生成相关 Task（上传、生成、审阅）、MCP Tool 新增（generate_promo_image、list_projects）
- Code / Test Impact：App.tsx 状态机需扩展为三阶段（dashboard / poster / promo），新增 Dashboard、PromoCreator 等组件，packages/mcp-server 新增宣传图生成 Tool，packages/shared 新增宣传图类型定义
- Phase Reset：SPEC_READY → 需重新进入 Design → Plan → Build → Check
- Approved By：user

## 2026-08-09 · UI 风格迭代：活泼轻快 + 两阶段布局

- Spec Version：0.2.0
- Change Type：Behavior Change + Scope Add
- Reason：用户要求换掉 ink-on-paper 水墨风格，改为暖色系圆角活泼风格；参考 fast-poster 布局重构为两阶段设计（生成阶段中置向导 + 编辑阶段左导航大画布右属性）
- Added IDs：UX-005（两阶段模式切换）、UX-006（左侧图标导航与扩展面板）、UX-007（暖色活泼视觉主题）、AC-008（编辑阶段版式切换）
- Modified IDs：UX-002（Rev2：侧栏缩略图 → 生成阶段卡片网格）、UX-003（Rev2：独立文案面板 → Tab属性面板）、UX-004（Rev2：增加控制点拖拽）、AC-001~007 更新描述
- Superseded / Deferred IDs：none
- Design Impact：全部 UI 章节需重设计 — 界面地图、交互语法、UI 状态模型、UI→Agent 契约、视觉/Accessibility
- Plan Impact：全部 UI 相关 Task 需重做（TASK-008~013, TASK-015~016）
- Code / Test Impact：packages/ui 大部分组件重写，packages/shared 版式定义保留，packages/mcp-server 逻辑保留
- Phase Reset：SPEC_READY → 需重新进入 Design → Plan → Build → Check
- Approved By：user

## 2026-08-08 · Initial Spec

- Spec Version：0.1.0
- Reason：从用户需求文档完成采访收敛，生成标准化 Plugin Spec
- Added IDs：REQ-001~007, UX-001~004, HOST-001~002, DATA-001~003, SEC-001~003, NFR-001~004, AC-001~007
- Modified IDs：none
- Superseded / Deferred IDs：none
- Impact：进入 Design 阶段
- Phase Reset：SPEC_READY
- Approved By：user

## Change Entry Template

### 2026-08-08 · [标题]

- Spec Version：[版本]
- Change Type：[Clarification / Scope Add / Scope Remove / Behavior / Host / Data / Permission / Acceptance / Correction]
- Reason：[用户原话或失败证据]
- Added IDs：[列表]
- Modified IDs：[列表]
- Superseded / Deferred IDs：[列表]
- Design Impact：[章节]
- Plan Impact：[Tasks]
- Code / Test Impact：[范围]
- Phase Reset：[保持 / SPEC_READY / DESIGN_READY / PLAN_READY / BUILDING]
- Approved By：[来源]
