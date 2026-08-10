---
name: plugin-spec
description: AI海报生成 Plugin 的完整需求规格，定义用户目标、Golden Path、功能边界与验收标准。
---

[文档信息]
    Plugin：AI海报生成
    Version：0.3
    Status：SPEC_READY
    Last Updated：2026-08-09

[一句话定义]
    中小商家和自媒体从业者使用这个 Plugin，通过文字描述需求让宿主 Agent 调用通义千问生成文案、调用通义万相生成海报底图或商品宣传图，最终在 Web 编辑器中完成海报文案嵌入与微调，或直接导出 AI 生成的商品宣传图。打开插件首先看到作品管理仪表盘（历史记录 + 新建按钮），可选择"海报制作"或"宣传图制作"两种创作模式。编辑器采用 warm-playful 暖色活泼视觉主题。

[用户与情境]
    - Primary User：中小商家、自媒体从业者、电商运营、职场办公人员、个人用户
    - 使用情境：需要快速制作促销海报、节日海报、商品宣传图、朋友圈引流图等商业视觉素材，但不会设计、没有美工资源
    - 当前替代方案：找美工外包（贵且慢）、用创客贴/Canva 等在线工具手动拼模板（模板单一、同质化严重）、放弃不做
    - 核心痛点：不会设计、没有美工、做图耗时、海报模板单一、商品图拍摄后不会做宣传图、AI 直接生图文字乱码错字

[核心结果]
    - Outcome：用户输入文字需求，3分钟内拿到一张可商用的高清海报（PNG/JPG）；或上传商品图+描述，1分钟内拿到一张可商用的商品宣传图
    - 为什么需要 Plugin：整合文案生成 + 图像生成 + 图文合成 + 编辑器的完整链路，单靠对话无法完成海报预览、版式选择和画布微调；商品宣传图需要图生图能力，单靠聊天无法上传图片和展示生成结果
    - 为什么需要 GUI：海报是视觉产品，用户必须能预览8种版式、挑选画面、在画布上直接调整文字位置/字体/颜色/大小；商品宣传图需要上传图片预览和结果预览；仪表盘需要可视化展示历史作品列表

[开发形态]
    - Form：companion-web-app
    - 判定依据：海报编辑需要完整 Web 界面（画布编辑器、多版式预览、拖拽定位、属性面板）；商品宣传图需要图片上传预览和结果展示；仪表盘需要可视化作品列表；交互复杂度不适合对话内轻量面板；目标宿主为 Claude Code，不支持嵌入渲染
    - 对话控制：Agent Skill 驱动，用户在 Claude Code 对话中描述需求即可触发 Web 编辑器打开；全部 MCP Tool 在对话中也可直接调用

[Golden Path]
    1. 安装或打开：用户在 Claude Code 中描述海报或宣传图需求，Skill 启动 Web 编辑器并在浏览器中打开
    2. 仪表盘首页：编辑器首先展示作品管理仪表盘——已有作品以卡片或列表形式展示（含缩略图、标题、类型、日期），顶部或中央有醒目的"新建"按钮；首次使用时展示空状态引导
    3. 模式选择：点击"新建"后弹出模式选择——"海报制作"或"宣传图制作"
    4a. 海报制作路径 — 生成阶段：进入中置向导式输入面板（主题、场景、风格、尺寸字段），可选上传参考图片区域，背景为暖色渐变
    4b. 海报制作路径 — AI 生成：用户点击"生成"按钮，进入进度展示界面；Agent 调用通义千问生成全套文案，并行调用通义万相生成8种版式纯净底图，进度条实时更新
    4c. 海报制作路径 — 版式选择：8张底图以大圆角卡片网格展示在中央区域，用户点击选中一张放大预览，点击"开始编辑"进入编辑阶段
    4d. 海报制作路径 — 编辑阶段：左侧 80px 图标导航栏 + 中间大画布 + 右侧 260px 属性面板，支持选中/拖拽/控制点调整文字、修改字体/颜色/大小，工具栏提供保存/导出/撤销/重做
    5a. 宣传图制作路径 — 上传与输入：上传商品图片（支持拖拽或点击上传，显示预览缩略图），在文本框中输入提示词描述商品特色和想要的宣传图风格
    5b. 宣传图制作路径 — AI 生成：点击"生成宣传图"按钮，Agent 调用通义万相图生图能力（以商品图为输入参考 + 提示词），同时调用通义千问生成配套宣传文案，进度条展示生成状态
    5c. 宣传图制作路径 — 结果审阅：生成完成后展示宣传图大图预览和配套宣传文案，用户可审阅效果，支持"重新生成"和"导出 PNG/JPG"
    6. 保存与导出：海报项目自动保存到项目目录，宣传图可直接导出；两个模式的作品都出现在仪表盘历史列表中
    7. 历史管理：仪表盘展示所有已完成作品，用户可点击打开继续编辑海报或查看宣传图，也可新建更多作品

[需求]

    [功能需求]

        - REQ-001：智能文案生成
            接入通义千问大模型，根据用户输入的场景、主题、风格独立生成全套海报文案（主标题、副标题、引流短句、活动说明、底部备注），文案可预览、可编辑、可选用。
            Source：user
            Confidence：confirmed
            Priority：must
            Status：active

        - REQ-002：多版式纯净海报底图生成
            接入通义万相图像生成模型，根据用户风格指令和尺寸批量生成8种版式的无文字纯净海报底图，覆盖上下居中、左右分栏、左文右图错落、全屏留白极简、居中堆叠、边角点缀、国风对称、悬浮层叠8种排版样式。
            Source：user
            Confidence：confirmed
            Priority：must
            Status：active

        - REQ-003：参考图构图/色调参考
            支持用户上传参考图片，选择"构图参考"或"色调参考"模式，将参考信息传递给图像生成模型，影响生成结果的构图或色调风格。
            Source：user
            Confidence：confirmed
            Priority：must
            Status：active

        - REQ-004：文案精准嵌入
            用户选定海报底图后，系统根据对应版式的文字定位规范，自动将校对无误的文案精准嵌入海报预设位置，完成图文合成。
            Source：user
            Confidence：confirmed
            Priority：must
            Status：active

        - REQ-005：基础在线编辑
            生成海报后支持在线编辑：修改文字内容、字体、颜色、大小、行间距、位置。
            Source：user
            Confidence：confirmed
            Priority：must
            Status：active

        - REQ-006：高清导出
            支持导出高清无水印海报，可选 PNG、JPG 格式。
            Source：user
            Confidence：confirmed
            Priority：must
            Status：active

        - REQ-007：项目状态自动保存与历史记录
            项目状态自动保存到当前 Claude Code 项目目录，支持关闭重开恢复，支持历史记录列表和二次编辑。
            Source：user
            Confidence：confirmed
            Priority：must
            Status：active

        - REQ-008：商品宣传图生成
            用户上传商品图片并输入提示词（含商品特色描述），AI 调用通义万相图生图能力以商品图为输入参考生成商品宣传图，同时调用通义千问生成配套宣传文案。宣传图无需在线编辑，直接审阅导出。支持重新生成。
            Source：user
            Confidence：confirmed
            Priority：must
            Status：active

        - REQ-009：作品管理仪表盘
            打开插件首先展示仪表盘首页，以卡片或列表形式展示所有历史作品（海报和宣传图混合展示，含缩略图、标题、类型标签、创建日期）。顶部或中央提供醒目的"新建"按钮，点击后弹出模式选择（海报制作 / 宣传图制作）。首次使用时展示空状态引导。支持从仪表盘点击作品重新打开编辑或查看。
            Source：user
            Confidence：confirmed
            Priority：must
            Status：active

    [交互需求]

        - UX-001：生成进度展示
            图像生成过程中显示进度条，每张底图生成完成即时展示（先出来先看），支持取消操作，单张失败不影响其他张。
            Source：user
            Confidence：confirmed
            Priority：must
            Status：active

        - UX-002：生成阶段版式卡片网格选择
            生成阶段完成后，8张底图以大圆角暖色卡片网格形式展示在中央区域，每张卡片显示版式名称和缩略图预览，用户点击放大预览后点击"开始编辑"进入编辑阶段。
            Source：user
            Confidence：confirmed
            Priority：must
            Status：active
            Revision：2 — 从侧栏缩略图条改为生成阶段全屏卡片网格，配合两阶段设计

        - UX-003：右侧Tab属性面板
            编辑阶段右侧 260px 属性面板分"属性"和"样式"两个 Tab，选中文案元素后可分别编辑文字内容和字体/颜色/大小/行间距/对齐，修改即时反映到画布。
            Source：user
            Confidence：confirmed
            Priority：must
            Status：active
            Revision：2 — 从独立文案面板改为 Tab 式属性面板（参考 fast-poster），文案编辑整合进属性 Tab

        - UX-004：编辑器画布操作
            在画布上可直接选中文字元素，拖拽调整位置（8个控制点 + 蓝色选中边框），通过右侧属性面板修改字体、颜色、大小、行间距。
            Source：user
            Confidence：confirmed
            Priority：must
            Status：active
            Revision：2 — 增加控制点拖拽调整区域（参考 fast-poster vue-drag-resize 交互）

        - UX-005：两阶段模式切换
            海报制作分为"生成阶段"和"编辑阶段"。生成阶段为中置向导式布局（输入→进度→版式选择），编辑阶段为左导航+画布+右属性的专业编辑布局。用户从版式选择点击"开始编辑"进入编辑阶段，可通过左侧导航随时返回版式选择。
            Source：user
            Confidence：confirmed
            Priority：must
            Status：active

        - UX-006：左侧图标导航与扩展面板
            编辑阶段左侧为 80px 图标导航栏，包含版式列表、文案、图层、导出等图标按钮。点击图标展开 328px 扩展面板（滑入动画），版式列表显示8张缩略图可随时切换，文案面板显示结构化文案可编辑。
            Source：user
            Confidence：confirmed
            Priority：must
            Status：active

        - UX-007：暖色活泼视觉主题
            编辑器整体采用暖色系（橙/珊瑚/桃色渐变）、大圆角（12-16px）卡片、毛玻璃面板、柔和阴影和渐变背景，替代原 ink-on-paper 水墨风格。字体使用圆体/无衬线字体，营造轻快活泼但不幼稚的专业感。
            Source：user
            Confidence：confirmed
            Priority：must
            Status：active

        - UX-008：仪表盘首页
            打开插件进入仪表盘首页。作品以暖色圆角卡片网格展示，每张卡片包含缩略图、标题、类型标签（海报/宣传图）、创建日期。顶部显示"AI 海报生成器"标题和"新建"按钮（主色调醒目）。点击"新建"弹出模式选择浮层——"海报制作"和"宣传图制作"两个大卡片选项，配有图标和简短说明。空状态展示引导插图和"创建你的第一个作品"提示。支持在仪表盘底部或侧边持续添加新作品。
            Source：user
            Confidence：confirmed
            Priority：must
            Status：active

        - UX-009：宣传图生成流程
            宣传图制作为线性流程：商品图上传区（支持拖拽/点击，预览缩略图）→ 提示词输入区（含商品特色描述引导文案）→ "生成宣传图"按钮 → 进度展示 → 结果页（宣传图大图预览 + 宣传文案展示 + 重新生成/导出按钮）。整体布局为中置卡片式，与海报生成阶段风格统一。
            Source：user
            Confidence：confirmed
            Priority：must
            Status：active

    [宿主需求]

        - HOST-001：Claude Code Skill 启动
            Plugin 通过 Claude Code Skill 触发，Skill 启动 Web 编辑器并在浏览器中打开。
            Source：inferred
            Confidence：confirmed
            Priority：must
            Status：active

        - HOST-002：MCP Server 提供领域 Tool
            MCP Server 提供文案生成、图像生成、项目状态管理等领域 Tool，Agent 通过 Tool 调用完成任务。
            Source：inferred
            Confidence：confirmed
            Priority：must
            Status：active

    [数据与文件]

        - DATA-001：项目状态存储
            项目状态（海报工程、文案、生成记录）存储在当前 Claude Code 项目的 .ai-poster-creation/ 目录下，跟随项目隔离。
            Source：user
            Confidence：confirmed
            Priority：must
            Status：active

        - DATA-002：参考图上传
            用户上传的参考图存储在项目状态目录中，仅用于构图/色调参考传递给 AI 模型。
            Source：user
            Confidence：confirmed
            Priority：must
            Status：active

        - DATA-003：导出文件
            导出的海报文件由用户选择保存位置，默认保存在项目目录下。
            Source：default
            Confidence：probable
            Priority：must
            Status：active

        - DATA-004：商品图上传
            用户上传的商品图片存储在项目状态目录中，用于图生图生成商品宣传图。
            Source：user
            Confidence：confirmed
            Priority：must
            Status：active

    [安全与权限]

        - SEC-001：DashScope API Key 管理
            需要用户提供阿里云 DashScope API Key，存储在本地配置中，不写入仓库、日志和模型上下文。
            Source：inferred
            Confidence：confirmed
            Priority：must
            Status：active

        - SEC-002：网络访问范围
            仅访问阿里云 DashScope API（dashscope.aliyuncs.com / cn-beijing.maas.aliyuncs.com），不访问其他外部服务。
            Source：inferred
            Confidence：confirmed
            Priority：must
            Status：active
            Revision：3 — 扩展域名范围覆盖通义万相图生图 API 端点

        - SEC-003：文件读写范围
            仅读写当前 Claude Code 项目目录和用户明确选择的文件，不访问其他路径。
            Source：default
            Confidence：confirmed
            Priority：must
            Status：active

    [非功能需求]

        - NFR-001：文案生成响应时间
            通义千问文案生成耗时不超过15秒。
            Source：inferred
            Confidence：probable
            Priority：should
            Status：active

        - NFR-002：图像生成响应时间
            单张底图生成耗时不超过30秒，8张并行总耗时不超过60秒。
            Source：inferred
            Confidence：probable
            Priority：should
            Status：active

        - NFR-003：编辑器操作响应
            画布上的直接操作（拖拽、选中、属性修改）响应时间不超过100ms。
            Source：default
            Confidence：probable
            Priority：should
            Status：active

        - NFR-004：导出画质
            导出海报分辨率与用户选择尺寸一致，画质清晰满足商业使用标准。
            Source：user
            Confidence：confirmed
            Priority：must
            Status：active

        - NFR-005：宣传图生成响应时间
            单张商品宣传图生成耗时不超过30秒。
            Source：inferred
            Confidence：probable
            Priority：should
            Status：active

[UI 与 Agent 分工]
    - UI 本地负责：仪表盘首页（作品列表、新建按钮、模式选择）、海报生成阶段中置向导（输入表单、进度展示、版式卡片网格选择）、海报编辑阶段左侧导航与扩展面板、画布编辑（选中/拖拽/控制点/属性修改）、右侧Tab属性面板、顶部工具栏（保存/导出/撤销/重做）、宣传图生成流程（商品图上传预览、提示词输入、结果审阅与导出）
    - Agent 负责：调用通义千问生成海报文案和宣传文案、调用通义万相生成海报底图和商品宣传图、文案嵌入定位计算
    - MCP Tool 负责：generate-copy（文案生成）、generate-poster-images（海报底图生成）、generate-promo-image（商品宣传图生成）、save-project（状态保存）、load-project（状态加载）、export-poster（导出）、list-projects（作品列表）

[目标宿主]
    [claude-code]
        Tier：required
        基准体验：Skill 启动完整 Web 编辑器，Agent 通过 MCP Tool 调用 AI 生成能力，编辑器在浏览器中运行
        可接受降级：无

[输入与输出]
    - 海报制作输入：海报主题、使用场景、偏好风格、所需尺寸、可选参考图片（构图/色调参考模式）
    - 宣传图制作输入：商品图片（PNG/JPG/WEBP）、提示词（商品特色描述 + 期望宣传图风格）
    - 输出：高清无水印海报（PNG/JPG）、商品宣传图（PNG/JPG）、宣传文案文本、项目状态文件（JSON）
    - 状态范围：跟随 Claude Code 项目，存储在 .ai-poster-creation/ 目录
    - 文件范围：项目目录读写，用户上传的参考图和商品图存储在状态目录
    - 网络：dashscope.aliyuncs.com / cn-beijing.maas.aliyuncs.com（通义千问 + 通义万相文生图 + 通义万相图生图）
    - Secret：DashScope API Key（本地配置存储）
    - Shell：无

[失败路径]
    - 海报底图失败：对应版式显示错误状态和具体原因，其他正常生成的底图不受影响；用户可点击"重试"重新生成失败的版式，或选择已成功的版式继续
    - 宣传图生成失败：展示错误原因和"重新生成"按钮，用户可修改提示词后重试
    - 关键失败：图像生成 API 调用失败（网络超时、额度不足、内容审核拒绝）
    - 恢复方式：所有失败状态保留用户已输入内容，不丢失数据

[首版范围]
    Must：
    - 文字输入 → AI 生成文案（通义千问）
    - AI 生成8种版式纯净海报底图（通义万相）
    - 参考图上传（构图/色调参考）
    - 文案精准嵌入海报
    - 基础在线编辑（文字、字体、颜色、大小、位置）
    - 高清导出 PNG/JPG
    - 项目状态自动保存与历史记录
    - 生成进度展示与取消
    - 仪表盘首页（作品列表 + 新建按钮 + 模式选择）
    - 商品宣传图生成（上传商品图 + 提示词 → 图生图 + 宣传文案 → 审阅导出）

    Should：
    - 编辑器撤销/重做
    - 多语言界面（中文优先）

    Could：
    - 替换背景图
    - 增减装饰元素
    - 调整整体配色
    - 宣传图批量生成（同一商品多场景/多风格）

[明确非目标]
    - 模板库调用（Backlog，首版不做预设模板）
    - 云端同步（跟随项目目录，不接云存储）
    - 移动端适配（首版仅桌面浏览器）
    - 多用户协作（单用户使用）
    - 计费系统（首版使用用户自有 API Key）
    - AI 抠图、智能抠像等扩展功能
    - 宣传图画布编辑（宣传图生成后直接导出，不做画布编辑）
    - 虚拟模特/试穿（服饰类专属功能，超出首版范围）

[验收标准]
    - AC-001（target：claude-code）：Given 用户安装 Plugin 并在 Claude Code 中描述"帮我生成一张双十一促销海报"，When Skill 启动 Web 编辑器并展示仪表盘首页，用户点击新建选择"海报制作"，进入生成阶段中置向导，填写主题、场景、风格、尺寸后点击生成，Then 编辑器展示进度条，60秒内在中央区域展示8种版式的圆角卡片网格和结构化文案。
    - AC-002（target：claude-code）：Given 8张底图卡片已展示，When 用户点击一张卡片放大预览并点击"开始编辑"，Then 编辑器切换到编辑阶段（左导航+大画布+右属性面板），文案自动嵌入对应版式的预设位置。
    - AC-003（target：claude-code）：Given 在编辑阶段画布中，When 用户在画布上选中文字并通过控制点拖拽调整，或在右侧属性面板修改字体、颜色、大小，Then 修改即时反映在画布上（<100ms）。
    - AC-004（target：claude-code）：Given 海报编辑完成，When 用户点击顶部工具栏导出并选择 PNG 格式，Then 生成与选定尺寸一致的高清无水印 PNG 文件。
    - AC-005（target：claude-code）：Given 用户上传一张参考图并选择"色调参考"模式，When 点击生成，Then 生成的底图色调风格与参考图一致。
    - AC-006（target：claude-code）：Given 图像生成过程中部分版式失败，When 用户查看进度，Then 失败版式在卡片网格中显示错误原因和重试按钮，成功版式正常展示可选中使用。
    - AC-007（target：claude-code）：Given 用户关闭编辑器后重新打开，When 加载项目，Then 仪表盘展示所有历史作品，点击海报作品可恢复之前的海报工程、文案和编辑状态，且保持在上次离开的阶段（生成或编辑）。
    - AC-008（target：claude-code）：Given 用户在编辑阶段，When 点击左侧导航图标展开扩展面板并选择另一张版式缩略图，Then 画布切换到对应底图，文案按新版式约束区域重新定位。
    - AC-009（target：claude-code）：Given 用户安装 Plugin 并打开，When 编辑器加载完成，Then 首先展示仪表盘首页——已有作品以卡片列表展示（含缩略图、标题、类型标签、日期），顶部有"新建"按钮；若首次使用无作品，展示空状态引导。
    - AC-010（target：claude-code）：Given 用户在仪表盘点击新建并选择"宣传图制作"，When 上传一张商品图片（PNG/JPG）、输入提示词描述商品特色和期望风格后点击"生成宣传图"，Then 展示生成进度，30秒内展示生成的宣传图大图预览和配套宣传文案，用户可导出 PNG/JPG 或点击"重新生成"。
    - AC-011（target：claude-code）：Given 用户在仪表盘首页，When 点击"新建"按钮，Then 弹出模式选择——"海报制作"和"宣传图制作"两个选项，配有图标和简短说明；选择后进入对应的创作流程。

[默认与假设]
    - 文案生成和图像生成均使用阿里云 DashScope API，用户需自行准备 API Key
    - 8种版式为 AI 根据版式描述 prompt 动态生成，非预设静态模板
    - 编辑器为 Web 应用，运行在 localhost，通过浏览器访问
    - 项目状态以 JSON 文件存储，不使用数据库
    - 图像生成默认使用通义万相最新可用模型
    - 商品宣传图使用通义万相 wan2.7-image-pro 图生图能力，商品图为输入参考
    - 仪表盘作品列表从 .ai-poster-creation/ 目录下的项目文件自动汇总

[Open Questions]
    P0：
    - None

    P1：
    - 通义万相图生图 API 对商品主体保持的一致性程度，需在 Design 阶段验证
    - 宣传图生成的文案是否需要嵌入图片中还是独立展示，需在 Design 阶段确定

    P2：
    - 编辑器是否需要支持自定义字体上传（首版使用系统默认字体即可）
    - 仪表盘是否需要筛选/搜索功能（首版作品数量有限，暂不需要）

[追踪]
    - AC-001 → 待 Design / Plan / Evidence 映射
    - AC-002 → 待 Design / Plan / Evidence 映射
    - AC-003 → 待 Design / Plan / Evidence 映射
    - AC-004 → 待 Design / Plan / Evidence 映射
    - AC-005 → 待 Design / Plan / Evidence 映射
    - AC-006 → 待 Design / Plan / Evidence 映射
    - AC-007 → 待 Design / Plan / Evidence 映射
    - AC-008 → 待 Design / Plan / Evidence 映射
    - AC-009 → 待 Design / Plan / Evidence 映射
    - AC-010 → 待 Design / Plan / Evidence 映射
    - AC-011 → 待 Design / Plan / Evidence 映射
