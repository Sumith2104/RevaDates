// scripts/check-schema.js
async function checkSchema() {
    const baseUrl = (process.env.FLUX_URL || 'https://api.fluxbase.io').trim();
    const projectId = process.env.FLUX_PROJECT_ID?.trim();
    const apiKey = process.env.FLUX_API?.trim();

    if (!projectId || !apiKey) {
        console.error('Missing credentials');
        return;
    }

    const sql = "DESCRIBE profiles";
    const url = baseUrl.endsWith('/api') ? `${baseUrl}/execute-sql` : `${baseUrl}/api/execute-sql`;
    
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                query: sql,
                projectId: projectId
            })
        });

        const data = await response.json();
        if (data.success) {
            const rows = data.result?.rows || data.result;
            const photosCol = rows.find(r => r.Field.toLowerCase() === 'photos');
            console.log('Photos column definition:', JSON.stringify(photosCol, null, 2));
        } else {
            console.error('Error:', data.error);
        }
    } catch (e) {
        console.error('Fetch error:', e.message);
    }
}

checkSchema();
