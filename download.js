import https from 'https';

export default function download(/** @type {string} */ url) {
  return new Promise((resolve, reject) => {
    const headers = { 'User-Agent': 'TomasHubelbauer', Authorization: 'token ' + process.argv[2] };
    const request = https.get(url, { headers }, async response => {
      /** @type {Buffer[]} */
      const buffers = [];
      for await (const buffer of response) {
        buffers.push(buffer);
      }

      resolve(JSON.parse(Buffer.concat(buffers)));
    });

    request.on('error', reject);
  });
}
