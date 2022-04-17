import download from './download.js';

export default async function downloadArray(/** @type {string} */ url) {
  const data = await download(url);
  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data.items)) {
    return data.items;
  }

  throw new Error(JSON.stringify(data, null, 2));
}
