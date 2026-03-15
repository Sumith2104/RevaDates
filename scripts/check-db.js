
const baseUrl = process.env.FLUX_URL || 'https://api.fluxbase.io';
const projectId = process.env.FLUX_PROJECT_ID;
const apiKey = process.env.FLUX_API;

async function checkDB() {
    console.log('--- Checking Profiles Table ---');
    const url = baseUrl.endsWith('/api') ? `${baseUrl}/execute-sql` : `${baseUrl}/api/execute-sql`;
    
    const payload = {
        projectId,
        query: 'SELECT id, email, name, photos FROM profiles'
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            console.error('Error:', await response.text());
            return;
        }

        const data = await response.json();
        const rows = data.result?.rows || [];
        console.log(`Found ${rows.length} profiles:`);
        rows.forEach(row => {
            console.log(`- ID: ${row.id}, Name: ${row.name}, Photos: ${row.photos} (Type: ${typeof row.photos})`);
        });
    } catch (error) {
        console.error('Failed:', error);
    }
}

checkDB();
