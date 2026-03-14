---
name: skill-cli2api
description: |
  使用 cli2api 将 Agent CLI 工具（Codex、Claude Code、Gemini CLI、Cursor Agent）启动为 OpenAI 和 Anthropic 兼容的 HTTP API 网关。

  当用户需要以下功能时触发此 skill：
  - 将 Codex/Claude/Gemini/Cursor Agent CLI 转换为 HTTP API 服务
  - 启动本地 API 网关来代理 AI 模型请求
  - 需要 OpenAI 兼容格式的本地模型服务
  - 需要 Anthropic 兼容格式的本地模型服务
  - 配置多提供商的 AI CLI 工具作为统一 API

  典型使用场景：
  - 用户说"把 codex 变成 api 服务"
  - 用户说"启动 claude api 网关"
  - 用户说"用 cli2api 启动服务"
  - 用户需要在本地启动兼容 OpenAI 格式的代理服务
  - 用户需要多提供商统一的 API 接口
---

# cli2api Skill

此 skill 帮助用户将各种 Agent CLI 工具（Codex、Claude Code、Gemini CLI、Cursor Agent）启动为 OpenAI 和 Anthropic 兼容的 HTTP API 网关。

## 项目位置

cli2api 项目位于 `/Users/selenium39/Desktop/cli2api`

## 快速开始

### 1. 安装依赖

```bash
cd /Users/selenium39/Desktop/cli2api
npm install
```

### 2. 登录到提供商

根据要使用的提供商，先完成登录：

```bash
# Codex
codex login

# Claude Code
claude login

# Gemini CLI
gemini auth login
```

### 3. 启动服务

#### 开发模式

```bash
# 启动 Codex 服务
cd /Users/selenium39/Desktop/cli2api
npm run dev -- codex

# 启动 Claude 服务
npm run dev -- claude

# 启动 Gemini 服务
npm run dev -- gemini

# 启动 Cursor Agent 服务
npm run dev -- cursor-agent
```

#### 生产模式

```bash
cd /Users/selenium39/Desktop/cli2api
npm run build
npm start -- codex
```

服务默认监听 `http://127.0.0.1:8000`

### 4. 环境检查

```bash
cd /Users/selenium39/Desktop/cli2api
npm run dev -- doctor
```

## 支持的 API 端点

| 端点 | 描述 |
|------|------|
| `GET /healthz` | 健康检查 |
| `GET /v1/models` | 列出模型 |
| `POST /v1/chat/completions` | OpenAI Chat Completions |
| `POST /v1/responses` | OpenAI Responses API |
| `POST /v1/messages` | Anthropic Messages API |
| `GET /debug/config` | 查看当前配置 |

## 使用示例

### OpenAI 格式请求

```bash
curl http://127.0.0.1:8000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-5.2",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'
```

### Anthropic 格式请求

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

### Python SDK 示例

**OpenAI SDK:**
```python
from openai import OpenAI

client = OpenAI(base_url="http://127.0.0.1:8000/v1", api_key="any")
resp = client.chat.completions.create(
    model="gpt-5.2",
    messages=[{"role": "user", "content": "Hello!"}],
)
print(resp.choices[0].message.content)
```

**Anthropic SDK:**
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

## CLI 参数

```
agent-cli-to-api [provider] [mode] [options]

Provider:  codex | claude | gemini | cursor-agent | doctor
Mode:      curl (log curl commands for incoming requests)

Options:
  --host <host>       绑定主机 (默认: 127.0.0.1)
  --port <port>       绑定端口 (默认: 8000)
  --log-level <level> 日志级别 (默认: info)
  --log-curl          记录可复制的 curl 命令
  --env-file <path>   从 .env 文件加载环境变量
  --preset <name>     使用配置预设
  --auto-env          自动从当前目录加载 .env
```

## 配置预设

使用 `--preset` 或 `CODEX_PRESET` 环境变量应用推荐配置：

| 预设 | 描述 |
|------|------|
| `codex-fast` | Codex Responses API，低推理强度，高并发 |
| `multi-fast` | 多提供商，客户端可切换提供商 |
| `claude-oauth` | Claude OAuth 直连 |
| `gemini-cloudcode` | Gemini Cloud Code 直连 |
| `cursor-fast` | Cursor Agent 快速模式 |
| `cursor-auto` | Cursor Agent 自动模式 |

## 常用环境变量

### 通用配置

| 变量 | 默认值 | 描述 |
|------|--------|------|
| `CODEX_GATEWAY_HOST` | `0.0.0.0` | 绑定主机 |
| `CODEX_GATEWAY_PORT` | `8000` | 绑定端口 |
| `CODEX_GATEWAY_TOKEN` | — | Bearer Token 认证（空=无认证） |
| `CODEX_PROVIDER` | `auto` | 强制提供商 |
| `CODEX_MODEL` | `gpt-5.2` | 默认模型 |
| `CODEX_MAX_CONCURRENCY` | `100` | 最大并发请求数 |
| `CODEX_TIMEOUT_SECONDS` | `600` | 请求超时时间 |

### Codex 配置

| 变量 | 默认值 | 描述 |
|------|--------|------|
| `CODEX_USE_CODEX_RESPONSES_API` | `false` | 使用 Codex Responses API |
| `CODEX_MODEL_REASONING_EFFORT` | `low` | 推理强度 |
| `CODEX_SANDBOX` | `read-only` | 沙盒模式 |
| `CODEX_APPROVAL_POLICY` | `never` | 审批策略 |

### Claude 配置

| 变量 | 默认值 | 描述 |
|------|--------|------|
| `CLAUDE_MODEL` | — | Claude 模型名称 |
| `CLAUDE_USE_OAUTH_API` | `false` | 直接使用 OAuth API |

### Gemini 配置

| 变量 | 默认值 | 描述 |
|------|--------|------|
| `GEMINI_MODEL` | — | Gemini 模型名称 |
| `GEMINI_USE_CLOUDCODE_API` | `false` | 使用 Cloud Code API |

## 提供商路由

在 `model` 字段中使用前缀路由到特定提供商：

```bash
# Codex (默认)
"model": "gpt-5.2"

# Claude Code
"model": "claude:sonnet"

# Gemini
"model": "gemini:gemini-3-flash-preview"

# Cursor Agent
"model": "cursor-agent:auto"
```

## 项目结构

```
src/
├── cli.ts                  # CLI 入口
├── server.ts               # Hono HTTP 服务器和路由
├── config.ts               # 环境变量配置和预设
├── doctor.ts               # 诊断工具
├── index.ts                # 模块入口
├── lib/
│   ├── openai-compat.ts    # OpenAI 格式转换
│   ├── anthropic-compat.ts # Anthropic 格式转换
│   └── http-client.ts      # HTTP 客户端
└── providers/
    ├── codex-cli.ts         # Codex CLI 提供商
    ├── codex-responses.ts   # Codex Responses API 提供商
    ├── claude-oauth.ts      # Claude OAuth 提供商
    ├── gemini-cloudcode.ts  # Gemini Cloud Code 提供商
    └── stream-json-cli.ts   # stream-json 格式解析器
```

## 注意事项

1. 确保已安装并登录对应的 CLI 工具（codex、claude、gemini）
2. Node.js 版本要求 >= 20
3. 首次使用建议运行 `npm run dev -- doctor` 检查环境
4. 使用 `--preset` 可以快速应用推荐的配置组合
