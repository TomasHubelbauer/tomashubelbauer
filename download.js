import https from 'https';

export default function download(/** @type {string} */ url) {
  return new Promise((resolve, reject) => {
    const headers = { 'User-Agent': 'TomasHubelbauer', Authorization: process.argv[2] ? 'token ' + process.argv[2] : '' };
    const request = https.get(url, { headers }, async response => {
      console.log(`${response.headers['x-ratelimit-remaining']}/${response.headers['x-ratelimit-limit']}: ${url}`);

      /** @type {Buffer[]} */
      const buffers = [];
      for await (const buffer of response) {
        buffers.push(buffer);
      }

      const buffer = Buffer.concat(buffers);
      try {
        resolve(JSON.parse(buffer));
      }
      catch (error) {
        reject(new Error(`Failed to parse the JSON: ${buffer}`, { cause: error }));
      }
    });

    request.on('error', reject);
  });
}
