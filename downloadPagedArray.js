import fs from 'fs';
import downloadArray from './downloadArray.js';
import query from './query.js';

export default async function downloadPagedArray(/** @type {string} */ url, /** @type {string} */ fileName) {
  try {
    return JSON.parse(await fs.promises.readFile(fileName));
  }
  catch (error) {
    if (error.code !== 'ENOENT') {
      throw error;
    }

    const result = [];
    const pages = Number({ ...await query(url + '?per_page=100') }.link.match(/(\d+)>; rel="last"$/)[1]);
    for (let page = 1; page <= pages; page++) {
      result.push(...await downloadArray(url + '?per_page=100&page=' + page));
      console.log('Fetched', url, 'page', page);
    }

    await fs.promises.writeFile(fileName, JSON.stringify(result, null, 2));
    return result;
  }
}
