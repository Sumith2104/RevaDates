// scripts/test-char-mangling.js
async function testUpdate() {
    const baseUrl = (process.env.FLUX_URL || 'https://api.fluxbase.io').trim();
    const projectId = process.env.FLUX_PROJECT_ID?.trim();
    const apiKey = process.env.FLUX_API?.trim();

    const userId = 'eb7e4094-02b4-4b65-91e8-53e694f8992b';
    const s3Key = "project_51c04beb753a42f3/buckets/0351bc04-69ca-42c4-b7cd-d0cba889df5a/1773587832348_ChatGPT_Image_Feb_23__2026__10_02_00_PM.png";
    
    // Test 1: Replace slashes with underscores
    const keyNoSlashes = s3Key.replace(/\//g, "-");
    const photosJson = JSON.stringify([keyNoSlashes]);

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
            console.log(`Verify result (no slashes):`, result.includes(keyNoSlashes) ? "CORRECT" : "MANGLED");
            if (!result.includes(keyNoSlashes)) {
                console.log(`DB value: ${result}`);
            }
        }
    } catch (e) {
        console.error('Error:', e.message);
    }
}

testUpdate();
