# cli2api

将 Agent CLI 工具（Codex、Claude Code、Gemini CLI、Cursor Agent）暴露为兼容 OpenAI 和 Anthropic 的 HTTP API 网关。

[English](./README.md)

## 功能

- **OpenAI 兼容** — `/v1/chat/completions`、`/v1/responses`
- **Anthropic 兼容** — `/v1/messages`（流式 & 非流式）
- **多 Provider 支持** — Codex、Claude Code、Gemini CLI、Cursor Agent
- **SSE 流式输出** — 所有接口均支持流式响应
- **OAuth 直连** — Claude OAuth API、Gemini Cloud Code API（无需本地 CLI）
- **Codex Responses API** — 直连 Codex 后端，支持 tool_calls
- **并发控制** — 可配置的最大并发数和信号量
- **图片输入** — 支持 base64 图片透传
- **认证** — 可选的 Bearer Token 鉴权
- **诊断工具** — 内置 `doctor` 命令检查环境配置

## 快速开始

### 安装依赖

```bash
npm install
```

### 登录 Provider

根据你使用的 provider 完成登录：

```bash
# Codex
codex login

# Claude Code
claude login

# Gemini CLI
gemini auth login
```

### 启动服务

```bash
# 开发模式
npm run dev -- codex

# 编译后运行
npm run build
npm start -- codex
```

默认监听 `http://127.0.0.1:8000`。

### 验证环境

```bash
npm run dev -- doctor
```

## 使用方式

### CLI 参数

```
agent-cli-to-api [provider] [mode] [options]

Provider:  codex | claude | gemini | cursor-agent | doctor
Mode:      curl（打印请求的 curl 命令）

Options:
  --host <host>       绑定地址（默认 127.0.0.1）
  --port <port>       绑定端口（默认 8000）
  --log-level <level> 日志级别（默认 info）
  --log-curl          记录 curl 命令
  --env-file <path>   加载 .env 文件
  --preset <name>     使用预设配置
  --auto-env          自动加载当前目录的 .env
```

### API 端点

| 端点 | 说明 |
|------|------|
| `GET /healthz` | 健康检查 |
| `GET /v1/models` | 模型列表 |
| `POST /v1/chat/completions` | OpenAI Chat Completions |
| `POST /v1/responses` | OpenAI Responses API |
| `POST /v1/messages` | Anthropic Messages API |
| `GET /debug/config` | 查看当前配置 |

### OpenAI 格式调用

```bash
curl http://127.0.0.1:8000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-5.2",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'
```

流式：

```bash
curl http://127.0.0.1:8000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-5.2",
    "stream": true,
    "messages": [{"role": "user", "content": "Hello!"}]
  }'
```

### Anthropic 格式调用

```bash
curl http://127.0.0.1:8000/v1/messages \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-token" \
  -d '{
    "model": "gpt-5.2",
    "max_tokens": 1024,
    "messages": [{"role": "user", "content": "Hello!"}]
  }'
```

流式：

```bash
curl http://127.0.0.1:8000/v1/messages \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-5.2",
    "max_tokens": 1024,
    "stream": true,
    "messages": [{"role": "user", "content": "Hello!"}]
  }'
```

### SDK 集成示例

**OpenAI Python SDK：**

```python
from openai import OpenAI

client = OpenAI(base_url="http://127.0.0.1:8000/v1", api_key="any")
resp = client.chat.completions.create(
    model="gpt-5.2",
    messages=[{"role": "user", "content": "Hello!"}],
)
print(resp.choices[0].message.content)
```

**Anthropic Python SDK：**

```python
from anthropic import Anthropic

client = Anthropic(base_url="http://127.0.0.1:8000/v1", api_key="any")
msg = client.messages.create(
    model="gpt-5.2",
    max_tokens=1024,
    messages=[{"role": "user", "content": "Hello!"}],
)
print(msg.content[0].text)
```

### 使用不同 Provider

通过 `model` 字段中的前缀指定 provider：

```bash
# Codex（默认）
"model": "gpt-5.2"

# Claude Code
"model": "claude:sonnet"

# Gemini
"model": "gemini:gemini-3-flash-preview"

# Cursor Agent
"model": "cursor-agent:auto"
```

或通过启动参数强制指定：

```bash
npm run dev -- claude    # 强制使用 Claude
npm run dev -- gemini    # 强制使用 Gemini
```

## 配置

所有配置通过环境变量设置，也可写入 `.env` 文件。

### 通用配置

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `CODEX_GATEWAY_HOST` | `0.0.0.0` | 绑定地址 |
| `CODEX_GATEWAY_PORT` | `8000` | 绑定端口 |
| `CODEX_GATEWAY_TOKEN` | — | Bearer Token 鉴权（留空则无需认证） |
| `CODEX_PROVIDER` | `auto` | 强制 provider：`codex`/`claude`/`gemini`/`cursor-agent` |
| `CODEX_MODEL` | `gpt-5.2` | 默认模型 |
| `CODEX_WORKSPACE` | 临时目录 | 工作目录 |
| `CODEX_MAX_CONCURRENCY` | `100` | 最大并发请求数 |
| `CODEX_TIMEOUT_SECONDS` | `600` | 请求超时（秒） |
| `CODEX_CORS_ORIGINS` | — | CORS 允许的 origin（逗号分隔） |
| `CODEX_MODEL_ALIASES` | — | 模型别名映射（JSON） |
| `CODEX_ADVERTISED_MODELS` | — | 对外公开的模型列表（逗号分隔） |
| `CODEX_ALLOW_CLIENT_PROVIDER_OVERRIDE` | `false` | 允许客户端通过 model 前缀切换 provider |
| `CODEX_ALLOW_CLIENT_MODEL_OVERRIDE` | `false` | 允许客户端指定模型 |

### Codex 配置

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `CODEX_USE_CODEX_RESPONSES_API` | `false` | 使用 Codex Responses API 直连后端 |
| `CODEX_MODEL_REASONING_EFFORT` | `low` | 推理强度：`low`/`medium`/`high` |
| `CODEX_SANDBOX` | `read-only` | 沙箱模式 |
| `CODEX_APPROVAL_POLICY` | `never` | 审批策略 |
| `CODEX_DISABLE_SHELL_TOOL` | `true` | 禁用 shell 工具 |

### Claude 配置

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `CLAUDE_MODEL` | — | Claude 模型名 |
| `CLAUDE_USE_OAUTH_API` | `false` | 使用 OAuth API 直连（无需 CLI） |
| `CLAUDE_OAUTH_CREDS_PATH` | `~/.claude/oauth_creds.json` | OAuth 凭证路径 |
| `CLAUDE_API_BASE_URL` | `https://api.anthropic.com` | API 基础 URL |

### Gemini 配置

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `GEMINI_MODEL` | — | Gemini 模型名 |
| `GEMINI_USE_CLOUDCODE_API` | `false` | 使用 Cloud Code API 直连 |
| `GEMINI_OAUTH_CREDS_PATH` | `~/.gemini/oauth_creds.json` | OAuth 凭证路径 |
| `GEMINI_PROJECT_ID` | — | GCP 项目 ID |

### Cursor Agent 配置

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `CURSOR_AGENT_MODEL` | — | Cursor Agent 模型 |
| `CURSOR_AGENT_WORKSPACE` | — | 工作目录 |
| `CURSOR_AGENT_API_KEY` | — | API Key |
| `CURSOR_AGENT_DISABLE_INDEXING` | `true` | 禁用索引 |

### 预设（Preset）

通过 `--preset` 或 `CODEX_PRESET` 使用推荐配置：

| 预设 | 说明 |
|------|------|
| `codex-fast` | Codex Responses API，低推理强度，高并发 |
| `multi-fast` | 多 provider，客户端可切换 |
| `claude-oauth` | Claude OAuth 直连 |
| `gemini-cloudcode` | Gemini Cloud Code 直连 |
| `cursor-fast` | Cursor Agent 快速模式 |
| `cursor-auto` | Cursor Agent 自动模式 |

## 项目结构

```
src/
├── cli.ts                  # CLI 入口
├── server.ts               # Hono HTTP 服务器 & 路由
├── config.ts               # 环境变量配置 & 预设
├── doctor.ts               # 诊断工具
├── index.ts                # 模块入口
├── lib/
│   ├── openai-compat.ts    # OpenAI 格式转换
│   ├── anthropic-compat.ts # Anthropic 格式转换
│   └── http-client.ts      # HTTP 客户端
└── providers/
    ├── codex-cli.ts         # Codex CLI provider
    ├── codex-responses.ts   # Codex Responses API provider
    ├── claude-oauth.ts      # Claude OAuth provider
    ├── gemini-cloudcode.ts  # Gemini Cloud Code provider
    └── stream-json-cli.ts   # stream-json 格式解析
```

## License

MIT
