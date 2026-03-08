const url = 'https://fluxbase.vercel.app/api/v1/projects/51c04beb753a42f3/query';
fetch(url, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer fl_6338ffa121f396ef82ed431f18b518f44c9d845de993028c'
    },
    body: JSON.stringify({ sql: 'SELECT 1' })
}).then(res => res.text()).then(text => console.log('RESULT:', text)).catch(console.error);
