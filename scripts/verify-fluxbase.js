
const FLUX_URL = process.env.FLUX_URL || 'https://v2.fluxbase.workers.dev';
const PROJECT_ID = process.env.FLUX_PROJECT_ID;
const API_KEY = process.env.FLUX_API;

async function testStorage() {
    console.log('--- Testing Fluxbase Storage Upload ---');
    if (!PROJECT_ID || !API_KEY) {
        console.error('FLUX_PROJECT_ID or FLUX_API not set');
        return;
    }

    const testData = Buffer.from('this is a test image content');
    const formData = new FormData();
    formData.append('file', new Blob([testData]), 'test.txt');

    try {
        const url = FLUX_URL.endsWith('/api') 
            ? `${FLUX_URL}/storage/upload?projectId=${PROJECT_ID}`
            : `${FLUX_URL}/api/storage/upload?projectId=${PROJECT_ID}`;
        console.log(`Uploading to: ${url}`);
        
        const response = await fetch(url, {
            method: 'POST',
            body: formData,
            headers: {
                'Authorization': `Bearer ${API_KEY}`
            }
        });

        const result = await response.json();
        console.log('Upload Result:', JSON.stringify(result, null, 2));
        
        if (result.url) {
            console.log('SUCCESS: Image uploaded to', result.url);
        } else {
            console.error('FAILED: No URL in response');
        }
    } catch (error) {
        console.error('Upload Error:', error);
    }
}

async function testWebhook() {
    console.log('\n--- Testing Webhook Implementation ---');
    const webhookUrl = 'http://localhost:9002/api/webhooks/fluxbase';
    const payload = {
        type: 'row.inserted',
        table: 'messages',
        new: {
            id: 'test-msg-id',
            match_id: 'test-match-id',
            content: 'Hello from test script!',
            sender_id: 'system',
            recipient_id: 'user-id'
        }
    };

    try {
        const bodyContent = JSON.stringify(payload);
        const signature = require('crypto')
            .createHmac('sha256', API_KEY)
            .update(bodyContent)
            .digest('hex');

        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'X-Fluxbase-Signature': signature
            },
            body: bodyContent
        });
        
        console.log('Webhook Result Status:', response.status);
        const text = await response.text();
        console.log('Webhook Response:', text);
    } catch (error) {
        console.error('Webhook test failed (is server running?):', error.message);
    }
}

// Note: This requires the local server to be running for webhook test
testStorage().then(() => testWebhook());
