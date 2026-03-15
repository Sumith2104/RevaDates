// scripts/test-short-update.js
async function testUpdate() {
    const baseUrl = (process.env.FLUX_URL || 'https://api.fluxbase.io').trim();
    const projectId = process.env.FLUX_PROJECT_ID?.trim();
    const apiKey = process.env.FLUX_API?.trim();

    if (!projectId || !apiKey) {
        console.error('Missing credentials');
        return;
    }

    const userId = 'eb7e4094-02b4-4b65-91e8-53e694f8992b';
    const s3Key = "test.png";
    const photosJson = JSON.stringify([s3Key]);

    const sql = `UPDATE profiles SET photos = '${photosJson}' WHERE id = '${userId}'`;
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
            const verifyResponse = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    query: `SELECT photos FROM profiles WHERE id = '${userId}'`,
                    projectId: projectId
                })
            });
            const verifyData = await verifyResponse.json();
            console.log('Verify result (short):', JSON.stringify(verifyData.result?.rows || verifyData.result, null, 2));
        }
    } catch (e) {
        console.error('Error:', e.message);
    }
}

testUpdate();
