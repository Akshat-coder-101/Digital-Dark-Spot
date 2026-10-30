# Digital Dark Spot — Deployment & Operations Guide

This guide details instructions for building, testing, deploying, and maintaining the Digital Dark Spot platform in production environments.

---

## 1. Prerequisites

- **Node.js**: `v18.0.0` or higher (`v20+` or `v22+` LTS recommended).
- **Package Manager**: `npm` (v9+) or `pnpm` (v8+).
- **Reverse Proxy**: Nginx or Caddy (for SSL/TLS termination and path routing).
- **Outbound HTTP Access**: Port 443 access to AI and search endpoints (Google Gemini, Groq, OpenAI, Anthropic, Tavily, Brave).

---

## 2. Environment Variables

Create a `.env` file in the project root or configure these variables in your deployment environment (e.g. Docker, Railway, Render, Fly.io, Kubernetes).

| Variable | Required | Secret | Default | Description |
| :--- | :---: | :---: | :--- | :--- |
| `PORT` | No | No | `3001` | Backend HTTP listening port. |
| `NODE_ENV` | No | No | `development` | Set to `production` in production deployments. |
| `SHOW_AI_STATUS` | No | No | `false` | When `false` in production, gates `/settings/ai` and `/api/llm/status`. |
| `LLM_PROVIDER_ORDER` | No | No | `gemini,groq,openai,anthropic` | Failover order across supported LLM providers. |
| `GEMINI_API_KEYS` | Recommended | **Yes** | — | Comma-separated Google Gemini API keys for round-robin rotation. |
| `GEMINI_MODEL` | No | No | `gemini-1.5-flash` | Gemini model ID. |
| `GROQ_API_KEYS` | Optional | **Yes** | — | Comma-separated Groq API keys for high-speed fallback. |
| `GROQ_MODEL` | No | No | `qwen/qwen3.8-27b` | Groq model ID. |
| `OPENAI_API_KEYS` | Optional | **Yes** | — | Comma-separated OpenAI API keys. |
| `OPENAI_MODEL` | No | No | `gpt-4o-mini` | OpenAI model ID. |
| `ANTHROPIC_API_KEYS`| Optional | **Yes** | — | Comma-separated Anthropic API keys. |
| `ANTHROPIC_MODEL` | No | No | `claude-3-5-haiku-20241022` | Anthropic model ID. |
| `TAVILY_API_KEYS` | Optional | **Yes** | — | Comma-separated Tavily search API keys for auto-discovery. |
| `BRAVE_API_KEYS` | Optional | **Yes** | — | Comma-separated Brave search API keys for auto-discovery. |
| `DISABLE_RATE_LIMIT`| No | No | `false` | Set to `true` only during automated integration test runs. |

> [!IMPORTANT]
> **Zero Key Leak Guarantee**: Never commit `.env` to version control. Before every commit or deploy, run `npm run check:secrets`.

---

## 3. Build & Run Commands

### Development
```bash
# Start both frontend (port 5173) and backend (port 3001) in parallel
npm run dev
```

### Production Build
```bash
# Build backend and frontend artifacts
npm run build
```
This produces:
- `backend/dist/`: Compiled Node.js ESM server.
- `frontend/dist/`: Production SPA static bundle.

### Start Production Server
```bash
# Start the backend API service
npm run start --workspace=backend
```

---

## 4. Reverse Proxy Configuration

In production, terminate HTTPS and proxy API traffic to the backend while serving frontend static files.

### Caddy Example
```caddy
darkspot.yourdomain.com {
    encode gzip zstd

    # Proxy API requests to backend
    handle /api/* {
        reverse_proxy 127.0.0.1:3001
    }

    # Serve static frontend
    handle {
        root * /var/www/digital-dark-spot/frontend/dist
        try_files {path} /index.html
        file_server
    }
}
```

### Nginx Example
```nginx
server {
    listen 80;
    server_name darkspot.yourdomain.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name darkspot.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/darkspot.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/darkspot.yourdomain.com/privkey.pem;

    root /var/www/digital-dark-spot/frontend/dist;
    index index.html;

    # API reverse proxy
    location /api/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Frontend Single Page Application fallback
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

---

## 5. Health Checks & Verification

After deployment, verify system health using these endpoints:

1. **Service Liveness**:
   ```bash
   curl -s http://localhost:3001/api/health
   # Response: {"status":"ok","app":"Digital Dark Spot","timestamp":"..."}
   ```

2. **Pre-Loaded Sample Verification**:
   ```bash
   curl -s http://localhost:3001/api/sample
   # Response returns ground-truth scholarship dataset
   ```

3. **Deterministic Evaluation Suite (Zero Key Dependency)**:
   ```bash
   npm run eval
   # Runs 3 ground-truth scenarios and verifies 100% test pass rate
   ```

4. **Secret Audit**:
   ```bash
   npm run check:secrets
   # Asserts 0 unmasked API keys in tracked code
   ```
