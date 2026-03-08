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
            // Basic escaping for test implementation
            return `'${val.toString().replace(/'/g, "''")}'`;
        });
    }
    return finalSql;
};

export const pool = {
    query: async (sql: string, params?: any[]) => {
        const finalSql = interpolate(sql, params);

        // Construct the URL using the base URL from env and appending the query path
        const baseUrl = process.env.FLUX_URL || 'https://api.fluxbase.io';
        let url = `${baseUrl}/v1/projects/${process.env.FLUX_PROJECT_ID}/query`;
        let payload: any = { sql: finalSql };

        // Map to custom Vercel Fluxbase API structure discovered locally
        if (baseUrl.includes('vercel.app')) {
            url = baseUrl.endsWith('/api') ? `${baseUrl}/execute-sql` : `${baseUrl}/api/execute-sql`;
            payload = { projectId: process.env.FLUX_PROJECT_ID, query: finalSql };
        } else if (baseUrl.endsWith('/api')) {
            url = `${baseUrl}/v1/projects/${process.env.FLUX_PROJECT_ID}/query`;
        }

        let response;
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
            throw new Error(`Fluxbase Network Error`);
        }

        if (!response.ok) {
            const errText = await response.text();

            throw new Error(`Fluxbase HTTP Error ${response.status}: ${errText}`);
        }

        const data = await response.json();
        // Support both Next.js engine custom format (data.result.rows) and native array formats
        const rows = data.result?.rows || data.data || [];
        const columns = data.result?.columns || [];
        return [rows, columns];
    }
};

export default pool;
