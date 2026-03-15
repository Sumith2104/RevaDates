// src/lib/fluxbase/server.ts

const interpolate = (sql: string, params?: any[]) => {
    let finalSql = sql;
    if (params && params.length > 0) {
        let i = 0;
        finalSql = sql.replace(/\?/g, () => {
            const val = params[i++];
            if (val === null || val === undefined) return 'NULL';
            if (typeof val === 'number') return val.toString();
            if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
            return `'${val.toString().replace(/'/g, "''")}'`;
        });
    }
    return finalSql;
};

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const pool = {
    query: async (sql: string, params?: any[]) => {
        const finalSql = interpolate(sql, params);
        const baseUrl = process.env.FLUX_URL || 'https://api.fluxbase.io';
        const url = baseUrl.endsWith('/api')
            ? `${baseUrl}/execute-sql`
            : `${baseUrl}/api/execute-sql`;

        const payload = {
            projectId: process.env.FLUX_PROJECT_ID,
            query: finalSql
        };

        console.log(`[DB] Executing SQL: ${finalSql}`);

        // Retry up to 3 times on 429 (rate limit) with exponential backoff
        const maxRetries = 3;
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            let response: Response;
            try {
                response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${process.env.FLUX_API}`
                    },
                    body: JSON.stringify(payload)
                });
            } catch (e) {
                console.error(`[DB] Network Error:`, e);
                throw new Error(`Fluxbase Network Error`);
            }

            if (response.status === 429 && attempt < maxRetries) {
                const waitMs = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
                console.warn(`[DB] Rate limited (429). Retrying in ${waitMs}ms... (attempt ${attempt + 1}/${maxRetries})`);
                await sleep(waitMs);
                continue;
            }

            if (!response.ok) {
                const errText = await response.text();
                console.error(`[DB] HTTP Error ${response.status}:`, errText);
                throw new Error(`Fluxbase HTTP Error ${response.status}: ${errText}`);
            }

            const data = await response.json();
            console.log(`[DB] Result:`, JSON.stringify(data.result?.rows || data.data || []).substring(0, 100) + '...');
            const rows = data.result?.rows || data.data || [];
            const columns = data.result?.columns || [];
            return [rows, columns];
        }

        throw new Error('Fluxbase: Max retries exceeded due to rate limiting.');
    }
};

export default pool;
