import https from 'https';

export default function query(/** @type {string} */ url, code = false) {
  return new Promise((resolve, reject) => {
    const headers = { 'User-Agent': 'TomasHubelbauer' };
    const request = https.get(url, { headers }, async response => {
      request.on('error', reject);
      resolve(code ? response.statusCode : response.headers);
    });
  });
}
