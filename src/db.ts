import { Pool } from 'pg';

let pool: Pool | null = null;

function getPool(): Pool {
    if (!pool) {
        pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            max: 5,
            idleTimeoutMillis: 30000,
        });
    }
    return pool;
}

export async function queryDatabase(sql: string, limit: number): Promise<Record<string, unknown>[]> {
    const client = await getPool().connect();
    try {
        // Append LIMIT to prevent runaway queries
        const limitedSql = sql.trim().replace(/;?\s*$/, '') + ` LIMIT ${limit}`;
        const result = await client.query(limitedSql);
        return result.rows;
    } finally {
        client.release();
    }
}
