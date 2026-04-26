# This is a demonstration of a repository

# DataBridge MCP

An MCP server that connects AI agents to PostgreSQL databases and local data files.

## Installation

```bash
npm install
npm run build
```

## Configuration

Copy `.env.example` to `.env` and fill in your values.

## Usage

Add to your MCP client configuration:

```json
{
  "mcpServers": {
    "databridge": {
      "command": "node",
      "args": ["dist/index.js"],
      "env": {
        "DATABASE_URL": "postgresql://...",
        "DATABRIDGE_API_KEY": "sk-db-..."
      }
    }
  }
}
```

## Tools

- `query_database` — Run SQL queries against your PostgreSQL database
- `read_file` — Read CSV or JSON files from the local filesystem
- `get_schema` — Get column definitions for a database table
- `report_usage` — Manually trigger billing report

## Security

File reads are restricted to `ALLOWED_FILE_DIRS` where configured.
SQL queries are limited to the configured `LIMIT` parameter.
