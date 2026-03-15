// scripts/test-base64url.js
// Verifies that the base64url pipe-separated encoding round-trips correctly in Fluxbase

function encodePhotoKey(key) {
    return Buffer.from(key, 'utf8')
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
}

function encodePhotosForDB(keys) {
    return keys.map(encodePhotoKey).join('|');
}

function decodePhotoKey(encoded) {
    if (!encoded) return '';
    if (encoded.startsWith('http')) return encoded;
    try {
        const b64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
        const pad = b64.length % 4;
        const padded = pad ? b64 + '='.repeat(4 - pad) : b64;
        return Buffer.from(padded, 'base64').toString('utf8');
    } catch (_) { return encoded; }
}

function decodePhotosFromDB(raw) {
    if (!raw) return [];
    if (raw.startsWith('[')) {
        try {
            const parsed = JSON.parse(raw.replace(/\*/g, '"'));
            if (Array.isArray(parsed)) return parsed.map(decodePhotoKey).filter(Boolean);
        } catch (_) {}
        return [];
    }
    return raw.split('|').filter(Boolean).map(decodePhotoKey).filter(Boolean);
}

async function test() {
    const baseUrl = (process.env.FLUX_URL || 'https://api.fluxbase.io').trim();
    const projectId = process.env.FLUX_PROJECT_ID?.trim();
    const apiKey = process.env.FLUX_API?.trim();
    const userId = 'eb7e4094-02b4-4b65-91e8-53e694f8992b';

    if (!projectId || !apiKey) {
        console.error('Missing credentials');
        return;
    }

    const s3Key = "project_51c04beb753a42f3/buckets/0351bc04-69ca-42c4-b7cd-d0cba889df5a/1773587832348_ChatGPT_Image_Feb_23__2026__10_02_00_PM.png";
    const encoded = encodePhotosForDB([s3Key]);
    
    console.log('Original key:', s3Key);
    console.log('Encoded for DB:', encoded);
    console.log('Decoded back:', decodePhotoKey(encoded));
    console.log('Round-trip OK:', decodePhotoKey(encoded) === s3Key ? '✅' : '❌');
    console.log('Contains slashes:', encoded.includes('/') ? '❌ BAD' : '✅ SAFE');
    console.log('Contains quotes:', encoded.includes('"') || encoded.includes("'") ? '❌ BAD' : '✅ SAFE');
    console.log('Contains brackets:', encoded.includes('[') || encoded.includes(']') ? '❌ BAD' : '✅ SAFE');
    console.log('');

    const url = baseUrl.endsWith('/api') ? `${baseUrl}/execute-sql` : `${baseUrl}/api/execute-sql`;

    // Write to DB
    const updateSql = `UPDATE profiles SET photos = '${encoded}' WHERE id = '${userId}'`;
    const updateRes = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({ query: updateSql, projectId })
    });
    const updateData = await updateRes.json();
    console.log('Update success:', updateData.success ? '✅' : '❌ ' + JSON.stringify(updateData.error));

    // Read back
    const selectRes = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({ query: `SELECT photos FROM profiles WHERE id = '${userId}'`, projectId })
    });
    const selectData = await selectRes.json();
    const dbValue = selectData.result?.rows?.[0]?.photos || '';
    console.log('DB raw value:', dbValue);
    const decoded = decodePhotosFromDB(dbValue);
    console.log('Decoded from DB:', decoded);
    console.log('Final match:', decoded[0] === s3Key ? '✅ PERFECT MATCH' : '❌ MISMATCH');
}

test().catch(console.error);
