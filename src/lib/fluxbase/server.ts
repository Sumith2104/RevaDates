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
        const baseUrl = process.env.FLUX_URL || 'https://api.fluxbase.io';
        
        // V4.0 Standard: /api/execute-sql with "query" payload
        const url = baseUrl.endsWith('/api') 
            ? `${baseUrl}/execute-sql` 
            : `${baseUrl}/api/execute-sql`;

        const payload = { 
            projectId: process.env.FLUX_PROJECT_ID, 
            query: finalSql 
        };

        console.log(`[DB] Executing SQL: ${finalSql}`);
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
            console.error(`[DB] Network Error:`, e);
            throw new Error(`Fluxbase Network Error`);
        }

        if (!response.ok) {
            const errText = await response.text();
            console.error(`[DB] HTTP Error ${response.status}:`, errText);
            throw new Error(`Fluxbase HTTP Error ${response.status}: ${errText}`);
        }

        const data = await response.json();
        console.log(`[DB] Result:`, JSON.stringify(data.result?.rows || data.data || []).substring(0, 100) + '...');
        
        // V4.0 Standard: results are in data.result.rows
        const rows = data.result?.rows || data.data || [];
        const columns = data.result?.columns || [];
        return [rows, columns];
    }
};

export default pool;
