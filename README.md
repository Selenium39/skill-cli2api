# skill-cli2api

A  Skill that exposes Agent CLI tools (Codex, Claude Code, Gemini CLI, Cursor Agent) as an OpenAI- and Anthropic-compatible HTTP API gateway.

## Overview

This skill wraps the cli2api project, allowing you to easily start and manage local API gateways for various AI agent CLI tools. Once running, you can use these agents through standard OpenAI or Anthropic API clients.

## Features

- **OpenAI Compatible** — `/v1/chat/completions`, `/v1/responses`
- **Anthropic Compatible** — `/v1/messages` (streaming & non-streaming)
- **Multi-Provider** — Codex, Claude Code, Gemini CLI, Cursor Agent
- **SSE Streaming** — All endpoints support streaming responses
- **OAuth Direct Connect** — Claude OAuth API, Gemini Cloud Code API (no local CLI needed)
- **Codex Responses API** — Direct backend connection with tool_calls support
- **Concurrency Control** — Configurable max concurrency with semaphore
- **Image Input** — Base64 image passthrough support
- **Authentication** — Optional Bearer Token auth
- **Diagnostics** — Built-in `doctor` command for environment checks

## Quick Start

### Prerequisites

```bash
# Install dependencies
npm install

# Login to your provider
# For Codex:
codex login

# For Claude Code:
claude login

# For Gemini CLI:
gemini auth login
```

### Start the Server

```bash
# Development mode
npm run dev -- codex

# Production (build first)
npm run build
npm start -- codex
```

The server listens on `http://127.0.0.1:8000` by default.

### Check Your Environment

```bash
npm run dev -- doctor
```

## Usage

### CLI Arguments

```
agent-cli-to-api [provider] [mode] [options]

Provider:  codex | claude | gemini | cursor-agent | doctor
Mode:      curl (log curl commands for incoming requests)

Options:
  --host <host>       Bind host (default: 127.0.0.1)
  --port <port>       Bind port (default: 8000)
  --log-level <level> Log level (default: info)
  --log-curl          Log copy-pastable curl commands
  --env-file <path>   Load env vars from a .env file
  --preset <name>     Use a config preset
  --auto-env          Auto-load .env from current directory
```

### API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /healthz` | Health check |
| `GET /v1/models` | List models |
| `POST /v1/chat/completions` | OpenAI Chat Completions |
| `POST /v1/responses` | OpenAI Responses API |
| `POST /v1/messages` | Anthropic Messages API |
| `GET /debug/config` | View current configuration |

### OpenAI Format Example

```bash
curl http://127.0.0.1:8000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "model": "codex",
    "messages": [{"role": "user", "content": "Hello!"}],
    "stream": true
  }'
```

### Anthropic Format Example

```bash
curl http://127.0.0.1:8000/v1/messages \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "anthropic-version: 2023-06-01" \
  -d '{
    "model": "claude-sonnet-4-20250514",
    "max_tokens": 1024,
    "messages": [{"role": "user", "content": "Hello!"}],
    "stream": true
  }'
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `CODEX_GATEWAY_PROVIDER` | Provider: `codex`, `claude`, `gemini`, `cursor-agent` | `auto` |
| `CODEX_GATEWAY_HOST` | Bind host | `127.0.0.1` |
| `CODEX_GATEWAY_PORT` | Bind port | `8000` |
| `CODEX_GATEWAY_LOG_LEVEL` | Log level | `info` |
| `CODEX_GATEWAY_MAX_CONCURRENCY` | Max concurrent requests | `3` |
| `CODEX_GATEWAY_TIMEOUT_SECONDS` | Request timeout | `600` |
| `CODEX_GATEWAY_BEARER_TOKEN` | Optional auth token | - |
| `CODEX_GATEWAY_ENABLE_CORS` | Enable CORS | `true` |

### Provider-Specific Variables

**Codex:**
- `CODEX_CLI_PATH` — Path to codex CLI
- `CODEX_SANDBOX_MODE` — Sandbox mode: `read-only`, `workspace-write`, `danger-full-access`
- `CODEX_APPROVAL_POLICY` — Approval policy: `untrusted`, `on-failure`, `on-request`, `never`

**Claude:**
- `CLAUDE_CLI_PATH` — Path to claude CLI
- `CLAUDE_OAUTH_KEY` — OAuth private key for direct API access

**Gemini:**
- `GEMINI_CLI_PATH` — Path to gemini CLI
- `GEMINI_OAUTH_KEY` — OAuth key for Cloud Code API
- `GEMINI_OAUTH_CLIENT_ID` — OAuth Client ID for Cloud Code API
- `GEMINI_OAUTH_CLIENT_SECRET` — OAuth Client Secret for Cloud Code API

**Cursor Agent:**
- `CURSOR_AGENT_CLI_PATH` — Path to cursor-agent CLI
- `CURSOR_AGENT_EXTRA_ARGS` — Additional CLI arguments

## Project Structure

```
skill-cli2api/
├── SKILL.md              # Skill documentation for LobsterAI
├── README.md             # This file
├── README.zh-CN.md       # Chinese documentation
├── package.json          # Node.js dependencies
├── tsconfig.json         # TypeScript configuration
├── src/
│   ├── cli.ts            # CLI entry point
│   ├── server.ts         # Hono HTTP server
│   ├── config.ts         # Configuration management
│   ├── doctor.ts         # Environment diagnostics
│   ├── lib/              # Shared utilities
│   │   ├── openai-compat.ts
│   │   ├── anthropic-compat.ts
│   │   └── http-client.ts
│   └── providers/        # Provider implementations
│       ├── codex-cli.ts
│       ├── codex-responses.ts
│       ├── claude-oauth.ts
│       ├── gemini-cloudcode.ts
│       └── stream-json-cli.ts
```

## Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev -- codex

# Type checking
npm run typecheck

# Build for production
npm run build

# Start production server
npm start -- codex
```

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
