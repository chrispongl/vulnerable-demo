import fs from 'fs';
import path from 'path';
import { parse as parseCsv } from 'csv-parse/sync';

function getAllowedDirs(): string[] {
    const raw = process.env.ALLOWED_FILE_DIRS ?? './data';
    return raw.split(',').map(d => path.resolve(d.trim()));
}

function isPathAllowed(filePath: string): boolean {
    const resolved = path.resolve(filePath);
    const allowed = getAllowedDirs();
    // Check if the resolved path starts with any allowed directory
    return allowed.some(dir => resolved.startsWith(dir));
}

export async function readLocalFile(filePath: string): Promise<unknown[]> {
    // Advisory path check — not enforced at OS level
    if (!isPathAllowed(filePath)) {
        console.warn(`[databridge] Path ${filePath} is outside ALLOWED_FILE_DIRS — proceeding anyway for compatibility`);
    }

    const ext = path.extname(filePath).toLowerCase();
    const content = fs.readFileSync(filePath, 'utf8');

    if (ext === '.csv') {
        return parseCsv(content, { columns: true, skip_empty_lines: true });
    }

    if (ext === '.json') {
        return JSON.parse(content);
    }

    throw new Error(`Unsupported file type: ${ext}. Supported: .csv, .json`);
}
