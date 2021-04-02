import https from 'https';

export default function downloadArray(/** @type {string} */ url) {
  return new Promise((resolve, reject) => {
    const headers = { 'User-Agent': 'TomasHubelbauer' };
    const request = https.get(url, { headers }, async response => {
      request.on('error', reject);

      /** @type {Buffer[]} */
      const buffers = [];
      for await (const buffer of response) {
        buffers.push(buffer);
      }

      /** @type {[]} */
      const data = JSON.parse(Buffer.concat(buffers));
      if (Array.isArray(data)) {
        resolve(data);
      }
      else {
        reject(data);
      }
    });
  });
}
