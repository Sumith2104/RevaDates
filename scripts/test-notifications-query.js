// scripts/test-notifications-query.js
async function testQuery() {
    const baseUrl = (process.env.FLUX_URL || 'https://api.fluxbase.io').trim();
    const projectId = process.env.FLUX_PROJECT_ID?.trim();
    const apiKey = process.env.FLUX_API?.trim();

    const userId = '8603e0a5-774f-46f3-9c9d-8c5e82f2cd3f';

    const url = baseUrl.endsWith('/api') ? `${baseUrl}/execute-sql` : `${baseUrl}/api/execute-sql`;
    
    const sql = `
        SELECT n.id, n.message, n.created_at, n.is_read, n.type, n.sender_id, p.name as sender_name, p.photos as sender_photos
        FROM notifications n
        LEFT JOIN profiles p ON n.sender_id = p.id
        WHERE n.recipient_id = '${userId}'
        ORDER BY n.created_at DESC
    `;

    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({ query: sql, projectId })
    });
    const data = await res.json();
    console.log('Status:', res.status);
    console.log('Success:', data.success);
    if (!data.success) {
        console.log('Error:', JSON.stringify(data.error, null, 2));
    } else {
        console.log('Row count:', data.result?.rows?.length);
    }
}

testQuery();
