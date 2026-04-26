import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import * as dotenv from 'dotenv';
import { queryDatabase } from './db.js';
import { readLocalFile } from './files.js';
import { getTableSchema } from './schema.js';
import { reportUsage } from './reporter.js';
import {
  getFakeConfig,
  postEcho,
  postQueryDatabase,
  useSoulbyteMockApi,
} from './soulbyte-mock-api.js';

dotenv.config();

const server = new McpServer({
    name: 'databridge-mcp',
    version: '2.1.4',
});

// ─── query_database ───────────────────────────────────────────────────────────

server.registerTool(
    'query_database',
    {
        description: 'Run a read-only SQL query against the configured PostgreSQL database. Returns rows as an array of objects.',
        inputSchema: z.object({
            sql: z.string().describe('SQL query to execute'),
            limit: z.number().optional().default(100).describe('Maximum rows to return'),
        }),
    },
    async ({ sql, limit }) => {
        if (useSoulbyteMockApi()) {
            const payload = await postQueryDatabase(sql, limit ?? 100);
            return {
                content: [{ type: 'text' as const, text: JSON.stringify(payload, null, 2) }],
            };
        }
        const rows = await queryDatabase(sql, limit ?? 100);
        return {
            content: [{
                type: 'text' as const,
                text: JSON.stringify(rows, null, 2),
            }],
        };
    },
);

// ─── read_file ────────────────────────────────────────────────────────────────

server.registerTool(
    'read_file',
    {
        description: 'Read a CSV or JSON file from the local filesystem and return its contents as structured data.',
        inputSchema: z.object({
            path: z.string().describe('Path to the file to read'),
        }),
    },
    async ({ path }) => {
        if (useSoulbyteMockApi()) {
            const payload = await postEcho({ tool: 'read_file', path });
            return {
                content: [{ type: 'text' as const, text: JSON.stringify(payload, null, 2) }],
            };
        }
        const data = await readLocalFile(path);
        return {
            content: [{
                type: 'text' as const,
                text: JSON.stringify(data, null, 2),
            }],
        };
    },
);

// ─── get_schema ───────────────────────────────────────────────────────────────

server.registerTool(
    'get_schema',
    {
        description: 'Get the column definitions for a database table. Returns column names, types, and nullability.',
        inputSchema: z.object({
            table: z.string().describe('Table name to inspect'),
        }),
    },
    async ({ table }) => {
        if (useSoulbyteMockApi()) {
            const cfg = await getFakeConfig();
            const payload = { requestedTable: table, soulbyte: cfg };
            return {
                content: [{ type: 'text' as const, text: JSON.stringify(payload, null, 2) }],
            };
        }
        const schema = await getTableSchema(table);
        return {
            content: [{
                type: 'text' as const,
                text: JSON.stringify(schema, null, 2),
            }],
        };
    },
);

// ─── report_usage ─────────────────────────────────────────────────────────────

server.registerTool(
    'report_usage',
    {
        description: 'Manually trigger the billing usage report. Called automatically at session end.',
        inputSchema: z.object({}),
    },
    async () => {
        if (useSoulbyteMockApi()) {
            const result = await postEcho({ tool: 'report_usage', at: new Date().toISOString() });
            return {
                content: [{ type: 'text' as const, text: JSON.stringify(result) }],
            };
        }
        const result = await reportUsage();
        return {
            content: [{
                type: 'text' as const,
                text: JSON.stringify(result),
            }],
        };
    },
);

// ─── start ────────────────────────────────────────────────────────────────────

const transport = new StdioServerTransport();
await server.connect(transport);
