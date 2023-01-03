import fs from 'fs';
import headers from './headers.js';
import reportRateLimit from './reportRateLimit.js';

/**
 * 
 * @param {string} url 
 */
export default async function downloadPages(url) {
  const result = [];
  do {
    console.group(`Downloading ${url}…`);
    const response = await fetch(url, { headers });
    reportRateLimit(response.headers);

    // Note that `Link` is not always there with single-page responses
    const link = response.headers.get('link') ?? '';
    const regex = /<(?<url>[^>]+)>; rel="(?<rel>first|prev|next|last)"/g;
    const links = [...link.matchAll(regex)].reduce(
      (links, match) => {
        links[match.groups['rel']] = match.groups['url'];
        console.log(`Found ${match.groups['rel']} link ${match.groups['url']}`);
        return links;
      },
      {}
    );

    const data = await response.json();
    
    // Save response to a file marked to be uploaded as an artifact for debugging
    await fs.promises.writeFile(`${url.match(/\w+/g).join('-')}.${response.status}.artifact.json`, JSON.stringify(data, null, 2));
    
    // GitHub Search API has a secondary rate limit which can report remaining calls but fail with a 403 still :(
    if (response.status !== 200) {
      throw new Error(`Errored (${response.status}) mid-way paging while on URL ${url}`);
    }

    if (Array.isArray(data)) {
      result.push(...data);
    }
    else {
      result.push(data);
    }

    url = links.next;
    console.groupEnd();
  }
  while (url);

  return result;
}
