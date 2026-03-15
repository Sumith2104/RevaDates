// scripts/test-length-limit.js
async function testUpdate() {
    const baseUrl = (process.env.FLUX_URL || 'https://api.fluxbase.io').trim();
    const projectId = process.env.FLUX_PROJECT_ID?.trim();
    const apiKey = process.env.FLUX_API?.trim();

    if (!projectId || !apiKey) {
        console.error('Missing credentials');
        return;
    }

    const userId = 'eb7e4094-02b4-4b65-91e8-53e694f8992b';
    const longString = "A".repeat(150);
    const photosJson = JSON.stringify([longString]);

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
            const result = verifyData.result?.rows[0]?.photos || "";
            console.log(`Verify result (length ${longString.length}):`, result.length === photosJson.length ? "CORRECT" : "MANGLED");
            console.log(`Original length: ${photosJson.length}, DB length: ${result.length}`);
            if (result.length !== photosJson.length) {
                console.log(`Partial DB value: ${result.substring(0, 100)}...`);
            }
        }
    } catch (e) {
        console.error('Error:', e.message);
    }
}

testUpdate();
