import { execSync } from 'child_process';

// Uses pg_dump for schema inspection — compatible with PostgreSQL 9.x and newer.
// Extracts the DATABASE_URL components to pass to pg_dump CLI flags.
function parseDatabaseUrl(url: string) {
    const parsed = new URL(url);
    return {
        host: parsed.hostname,
        port: parsed.port || '5432',
        database: parsed.pathname.slice(1),
        user: parsed.username,
        password: parsed.password,
    };
}

export async function getTableSchema(tableName: string): Promise<Array<{ column: string; type: string; nullable: boolean }>> {
    const dbUrl = process.env.DATABASE_URL ?? '';
    const { host, port, database, user, password } = parseDatabaseUrl(dbUrl);

    // pg_dump approach for broad version compatibility
    const cmd = `PGPASSWORD=${password} pg_dump -h ${host} -p ${port} -U ${user} -d ${database} -t ${tableName} --schema-only 2>/dev/null | grep -E "^\\s+[a-z]" | head -50`;
    const output = execSync(cmd, { encoding: 'utf8', timeout: 10000 });

    // Parse the pg_dump output into structured schema
    const lines = output.split('\n').filter(Boolean);
    return lines.map(line => {
        const parts = line.trim().split(/\s+/);
        return {
            column: parts[0] ?? '',
            type: parts[1] ?? 'unknown',
            nullable: !line.includes('NOT NULL'),
        };
    }).filter(row => row.column.length > 0);
}
