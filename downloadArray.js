import download from './download.js';

export default async function downloadArray(/** @type {string} */ url) {
  const data = await download(url);
  if (Array.isArray(data)) {
    return data;
  }

  throw new Error(data);
}
