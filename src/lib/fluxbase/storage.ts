// src/lib/fluxbase/storage.ts

export async function uploadToFluxbase(file: File): Promise<{ s3Key?: string; error?: string }> {
    const baseUrl = process.env.FLUX_URL || 'https://api.fluxbase.io';
    const projectId = process.env.FLUX_PROJECT_ID;
    const apiKey = process.env.FLUX_API;
    const bucketId = process.env.FLUX_BUCKET || 'photos';

    if (!projectId || !apiKey) {
        return { error: 'Missing Fluxbase configuration (Project ID or API Key)' };
    }

    const uploadUrl = baseUrl.endsWith('/api')
        ? `${baseUrl}/storage/upload`
        : `${baseUrl}/api/storage/upload`;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('projectId', projectId);
    formData.append('bucketId', bucketId);

    try {
        const response = await fetch(uploadUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`
            },
            body: formData
        });

        if (!response.ok) {
            const errorText = await response.text();
            return { error: `Fluxbase Storage Error ${response.status}: ${errorText}` };
        }

        const data = await response.json();
        // V4.0 spec returns s3_key inside a file object
        const s3Key = data.file?.s3_key || data.s3Key || data.key || (data.url ? data.url.split('/').pop() : null);

        if (s3Key) {
            return { s3Key };
        }

        return { error: 'Upload successful but no s3_key returned from Fluxbase' };
        
    } catch (err: any) {
        return { error: `Network error during upload: ${err.message}` };
    }
}

export async function getPresignedUrl(s3Key: string): Promise<string | null> {
    if (!s3Key) return null;
    
    // If it's already a full URL (legacy), return it
    if (s3Key.startsWith('http')) return s3Key;

    const baseUrl = process.env.FLUX_URL || 'https://api.fluxbase.io';
    const projectId = process.env.FLUX_PROJECT_ID;
    const apiKey = process.env.FLUX_API;

    const url = baseUrl.endsWith('/api')
        ? `${baseUrl}/storage/url?s3Key=${encodeURIComponent(s3Key)}&projectId=${projectId}`
        : `${baseUrl}/api/storage/url?s3Key=${encodeURIComponent(s3Key)}&projectId=${projectId}`;

    console.log(`[Storage] Fetching presigned URL: ${url}`);
    try {
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${apiKey}`
            }
        });
        if (!response.ok) {
            const errText = await response.text();
            console.error(`[Storage] Error fetching URL (${response.status}): ${errText}`);
            return null;
        }
        const data = await response.json();
        console.log(`[Storage] Resolved URL: ${data.url ? 'YES' : 'NO'}`);
        return data.url || null;
    } catch (e: any) {
        console.error(`[Storage] Network error: ${e.message}`);
        return null;
    }
}
