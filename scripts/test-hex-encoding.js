// scripts/test-hex-encoding.js
async function testUpdate() {
    const baseUrl = (process.env.FLUX_URL || 'https://api.fluxbase.io').trim();
    const projectId = process.env.FLUX_PROJECT_ID?.trim();
    const apiKey = process.env.FLUX_API?.trim();

    const userId = 'eb7e4094-02b4-4b65-91e8-53e694f8992b';
    const s3Key = "project_51c04beb753a42f3/buckets/0351bc04-69ca-42c4-b7cd-d0cba889df5a/1773587832348_ChatGPT_Image_Feb_23__2026__10_02_00_PM.png";
    
    // Hex encode the key
    const hexKey = Buffer.from(s3Key).toString('hex');
    const photosJson = JSON.stringify([hexKey]);

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
            
            const matches = result.includes(hexKey);
            console.log(`Verify result (hex):`, matches ? "CORRECT" : "MANGLED");
            
            if (matches) {
                const decoded = Buffer.from(JSON.parse(result)[0], 'hex').toString('utf8');
                console.log(`Decoded matches original:`, decoded === s3Key ? "YES" : "NO");
            } else {
                console.log(`DB value: ${result}`);
            }
        }
    } catch (e) {
        console.error('Error:', e.message);
    }
}

testUpdate();
