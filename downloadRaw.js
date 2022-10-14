import https from 'https';

export default function downloadRaw(/** @type {string} */ url) {
  return new Promise((resolve, reject) => {
    const headers = { 'User-Agent': 'TomasHubelbauer', Authorization: process.argv[2] ? 'token ' + process.argv[2] : '' };
    const request = https.get(url, { headers }, async response => {
      console.log(`${response.headers['x-ratelimit-remaining']}/${response.headers['x-ratelimit-limit']}: ${url}`);
      console.log(url, 'response');
      console.log(response.statusCode, response.statusMessage);
      console.log(response.headers);

      /** @type {Buffer[]} */
      const buffers = [];
      for await (const buffer of response) {
        console.log(url, 'buffer');
        buffers.push(buffer);
      }

      console.log(url, 'buffers', buffers.length);
      const buffer = Buffer.concat(buffers);
      resolve(buffer);
    });

    request.on('error', reject);
  });
}
