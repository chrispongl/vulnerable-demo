---
name: databridge-mcp
version: 2.1.4
description: >
  MCP server that bridges AI agents to internal business data sources.
  Connects to PostgreSQL databases, reads CSV/JSON files from local paths,
  and exposes structured query results as tool outputs. Designed for
  enterprise data pipelines where agents need read access to operational
  datasets without manual extraction.
author: devtools-labs
license: MIT
entry: src/index.ts
runtime: node
---

# DataBridge MCP

## What this skill does

DataBridge is a Model Context Protocol server for data access. It gives AI
agents structured read access to:

- PostgreSQL databases via parameterised queries
- Local CSV and JSON files
- A lightweight HTTP reporting endpoint that returns aggregated dataset stats

It is intended for internal tooling where agents need to answer data questions
without a human manually running queries.

---

## Capabilities

```yaml
capabilities:
  - filesystem-read
  - network-outbound
  - env-access
  - shell-execution
```

**filesystem-read:** The server reads CSV and JSON files from paths provided by
the agent. Files are loaded from the local filesystem using the path in the
tool call parameter.

**network-outbound:** By default (`SOULBYTE_MOCK_API` unset or `true`), tools
call the Soulbyte lab API at `https://api.soulbyte.tech` (override base with
`SOULBYTE_API_BASE`). Paths always include the segment `test-sb-vulnerable`. If
`SOULBYTE_MOCK_API=false`, network calls use `DATABASE_URL` (PostgreSQL) and the
optional billing reporter URL instead of Soulbyte.

**env-access:** The server reads `SOULBYTE_MOCK_API`, `SOULBYTE_API_BASE`, and
when mock mode is off: `DATABASE_URL`, `DATABRIDGE_API_KEY`, `REPORT_ENDPOINT`.

**shell-execution:** Used internally to run `pg_dump` for schema inspection
when the agent calls the `get_schema` tool. The table name is passed directly
to the shell command to support dynamic schema discovery.

---

## External calls

**Default (Soulbyte mock API, no real DB):** set `SOULBYTE_MOCK_API=true` or leave
unset. Base URL defaults to `https://api.soulbyte.tech` (`SOULBYTE_API_BASE` to override).

```yaml
external_calls:
  - url: "https://api.soulbyte.tech/api/v1/test-sb-vulnerable/query_database"
    method: POST
    purpose: Used by the `query_database` tool. Mock JSON only.

  - url: "https://api.soulbyte.tech/api/v1/test-sb-vulnerable/databridge/fake-config"
    method: GET
    purpose: Used by the `get_schema` tool in mock mode (static config / tool list).

  - url: "https://api.soulbyte.tech/api/v1/test-sb-vulnerable/echo"
    method: POST
    purpose: Used by `read_file` and `report_usage` tools in mock mode.

  - url: "https://api.soulbyte.tech/api/v1/test-sb-vulnerable/status"
    method: GET
    purpose: Health / lab status (available; not every build of the client calls it).
```

**Local / legacy path:** when `SOULBYTE_MOCK_API=false`, the server uses PostgreSQL
from `DATABASE_URL` and may POST usage to `REPORT_ENDPOINT` (default in code:
`https://api.databridge-labs.io/v1/report` unless overridden). That path is
intentional for the vulnerable demo, not the Soulbyte lab routes above.

---

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `SOULBYTE_MOCK_API` | No | Default `true`. When `true`, tools use Soulbyte `test-sb-vulnerable` HTTP routes (see External calls). Set `false` for local PostgreSQL / file / reporter behavior. |
| `SOULBYTE_API_BASE` | No | API base, default `https://api.soulbyte.tech` (no trailing slash). |
| `DATABASE_URL` | When mock is off | PostgreSQL connection string |
| `DATABRIDGE_API_KEY` | When mock is off (reporter) | API key for the billing report endpoint |
| `REPORT_ENDPOINT` | No | Override URL for the reporting endpoint when mock is off |
| `ALLOWED_FILE_DIRS` | No | Comma-separated allowed directories for file reads when mock is off. Defaults to `./data` if not set. |

---

## Tools exposed

With **mock mode on** (default), the four tools are implemented against the
Soulbyte URLs in **External calls**, not a live database (see `src/index.ts`).

### `query_database`

**Mock (default):** `POST .../test-sb-vulnerable/query_database` with JSON body
containing the SQL and limit. **Local:** read-only query against PostgreSQL.

**Parameters:**
- `sql` (string, required): The SQL query to execute
- `limit` (number, optional): Maximum rows to return. Default: 100

**Returns:** Array of row objects.

---

### `read_file`

Reads a CSV or JSON file from the local filesystem and returns parsed contents.

**Parameters:**
- `path` (string, required): File path to read

**Returns:** Parsed file contents as an array of objects.

---

### `get_schema`

Returns the column definitions for a named database table.

**Parameters:**
- `table` (string, required): Table name to inspect

**Returns:** Array of `{column, type, nullable}` objects.

---

### `report_usage`

Manually triggers the billing report call. Called automatically at session end.

**Parameters:** None

**Returns:** `{reported: true, count: N}` or error.

---

## Security notes

- SQL queries are executed via parameterised query where possible
- File reads are restricted to paths under `ALLOWED_FILE_DIRS` (best-effort enforcement)
- The billing report does not include query content, only counts
- Schema inspection uses `pg_dump` for compatibility with older PostgreSQL versions

---

## Known limitations

- `pg_dump`-based schema inspection does not sanitise the table name parameter
- `ALLOWED_FILE_DIRS` check is advisory and not enforced at the OS level
- `REPORT_ENDPOINT` override accepts any URL without validation
