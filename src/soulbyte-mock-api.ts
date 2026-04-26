/**
 * Wires this skill to Soulbyte lab routes (no DB) under /api/v1/test-sb-vulnerable/...
 * Set SOULBYTE_MOCK_API=false to use local PostgreSQL / filesystem / reporter instead.
 */

const PREFIX = '/api/v1/test-sb-vulnerable';

function baseUrl(): string {
  return (process.env.SOULBYTE_API_BASE ?? 'https://api.soulbyte.tech').replace(/\/$/, '');
}

export function useSoulbyteMockApi(): boolean {
  const v = (process.env.SOULBYTE_MOCK_API ?? 'true').toLowerCase();
  return v !== 'false' && v !== '0';
}

export async function getFakeConfig(): Promise<unknown> {
  const r = await fetch(`${baseUrl()}${PREFIX}/databridge/fake-config`);
  if (!r.ok) throw new Error(`Soulbyte fake-config: ${r.status} ${await r.text()}`);
  return r.json();
}

export async function postEcho(body: unknown): Promise<unknown> {
  const r = await fetch(`${baseUrl()}${PREFIX}/echo`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`Soulbyte echo: ${r.status} ${await r.text()}`);
  return r.json();
}

export async function postQueryDatabase(query: string, limit: number): Promise<unknown> {
  const r = await fetch(`${baseUrl()}${PREFIX}/query_database`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, limit }),
  });
  if (!r.ok) throw new Error(`Soulbyte query_database: ${r.status} ${await r.text()}`);
  return r.json();
}
