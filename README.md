# AI Poster & Promo Creation

基于 Doubao Seedream 的智能海报和商品宣传图生成工具，作为 Claude Code 插件运行。

## 功能

- **海报制作**：AI 文生图 → 画布编辑（布局网格、元素属性、复制调整）→ 导出
- **宣传图制作**：上传商品图 + 提示词 → AI 图生图 → 三步优化（风格定调/结构深化/电商落地）→ 生成详情页 → 导出
- **仪表盘**：历史作品管理，支持继续编辑和查看
- **VLM 优化建议**：生成后自动分析画面缺陷并给出优化方案

## 技术栈

| 层 | 技术 |
|---|---|
| 前端 | React 18 + TypeScript + Vite |
| MCP Server | TypeScript (stdio transport) |
| API 服务 | Express.js (start-server.mjs) |
| 图像生成 | 火山引擎 ARK (doubao-seedream-4-5-251128) |
| 文本/视觉模型 | 火山引擎 ARK (doubao-seed-2-1-pro-260628) |
| UI 主题 | warm-playful |

## 项目结构

```
├── packages/
│   ├── shared/          # 共享类型和常量
│   ├── mcp-server/      # MCP Server（Tool 定义 + 业务逻辑）
│   └── ui/              # React 前端
├── skills/              # Claude Code Skills（4个）
│   ├── generate-poster/
│   ├── edit-poster/
│   ├── export-poster/
│   └── generate-promo/
├── contracts/           # JSON Schema 契约
├── tests/               # 测试脚本
├── start-server.mjs     # Express API 服务入口
├── plugin.yaml          # 插件元数据
└── .mcp.json            # MCP 配置
```

## 快速开始

### 环境要求

- Node.js >= 22
- 火山引擎 ARK API Key（[控制台获取](https://console.volcengine.com/ark)）

### 安装

```bash
# 克隆仓库
git clone https://github.com/eryeru12/ai-poster-creation.git
cd ai-poster-creation

# 安装依赖
npm install

# 构建
npm run build
```

### 配置

创建 `.env` 文件（已自动被 .gitignore 排除）：

```bash
ARK_API_KEY=your-ark-api-key-here
PORT=3456
```

### 启动

```bash
# 开发模式
bash _start.sh

# 或直接启动
ARK_API_KEY=your-key node start-server.mjs
```

访问 `http://localhost:3456` 打开前端界面。

### 安装为 Claude Code 插件

```bash
claude plugin marketplace add /path/to/ai-poster-creation
claude plugin install ai-poster-creation@local
```

## MCP Tools

| Tool | 描述 |
|---|---|
| `generate_poster_image` | 文生图，根据提示词生成海报 |
| `generate_promo_image` | 图生图，根据商品图和提示词生成宣传图（long-running） |
| `generate_promo_copy` | 为宣传图生成文案 |
| `list_projects` | 列出所有历史作品 |
| `promo_project_state` | 获取/恢复宣传图项目状态 |
| `save_poster_state` | 保存海报编辑状态 |
| `get_poster_state` | 获取海报编辑状态 |

## Skills

| Skill | 触发示例 |
|---|---|
| `generate-poster` | "帮我生成一张海报" |
| `edit-poster` | "调整海报布局" |
| `export-poster` | "导出这张海报" |
| `generate-promo` | "帮我做一张商品宣传图" |

## License

MIT
