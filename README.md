# TaskFoundry Free Tier API

The TaskFoundry Free Tier API provides a bridge to Groq-powered AI for generating task descriptions and commit messages from git diffs. This API is designed to power the community and free tier versions of TaskFoundry developer tools.

## Features

- **Task Generation**: Analyzes git diffs and creates structured task descriptions (Title, Summary, Technical implementation details).
- **Commit Message Generation**: Generates concise, conventional commit messages from git diffs.
- **Groq-Powered**: Leverages high-performance models like `llama-3.3-70b-versatile` via the Groq API.
- **Fair-Use Rate Limiting**: Built-in daily limits to ensure service availability for the community.
- **Production Ready**: Includes security headers (Helmet), CORS support, and health check endpoints.

## API Endpoints

### Base URL: `/api`

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/grok/task` | `POST` | Generate task descriptions from git diff. |
| `/grok/commit` | `POST` | Generate conventional commit messages from git diff. |
| `/grok/stats` | `GET` | Get API status, limits, and available models. |
| `/health` | `GET` | Simple health check. |

### Request Format (`POST` endpoints)

```json
{
  "diff": "string (git diff content)",
  "engineConfig": {
    "model": "string (optional)",
    "detailed": "boolean (optional, for tasks)",
    "temperature": "number (optional)",
    "maxTokens": "number (optional)"
  }
}
```

## Rate Limits (Daily)

The API implements rate limiting based on the client IP address:

- **Tasks**: 10 requests per day.
- **Commits**: 5 requests per day.
- **Total Max**: 15 requests per day.

## Tech Stack

- **Runtime**: Node.js (>= 18.x)
- **Framework**: Express.js
- **AI**: Groq API
- **Deployment**: Vercel
- **Middleware**: `express-rate-limit`, `helmet`, `cors`, `express-async-handler`

## Development Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/appohfaiths/taskfoundry-freetier-api.git
   cd taskfoundry-freetier-api
   ```

2. **Install dependencies**:
   ```bash
   pnpm install
   ```

3. **Configure environment variables**:
   Create a `.env` file in the root:
   ```env
   PORT=8080
   TASKFOUNDRY_COMMUNITY_KEY=your_groq_api_key
   ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
   ```

4. **Run in development mode**:
   ```bash
   pnpm dev
   ```

## License

This project is licensed under the **Apache-2.0** License - see the [package.json](package.json) file for details.
