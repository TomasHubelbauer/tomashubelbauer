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

    const link = response.headers.get('link');
    if (!link) {
      console.log(response.headers);
    }

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
