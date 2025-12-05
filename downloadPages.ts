import headers from "./headers.ts";
import reportRateLimit from "./reportRateLimit.ts";

export default async function downloadPages(initialUrl: string) {
  const result: any[] = [];
  let url: string | undefined = initialUrl;
  do {
    if (!url) {
      break;
    }

    console.group(`Downloading ${url}…`);
    const response: any = await fetch(url, { headers });
    reportRateLimit(response.headers);

    // Note that `Link` is not always there with single-page responses
    const link = response.headers.get("link") ?? "";
    const regex = /<(?<url>[^>]+)>; rel="(?<rel>first|prev|next|last)"/g;
    const links = [...link.matchAll(regex)].reduce((map, match) => {
      if (match.groups?.rel && match.groups.url) {
        map[match.groups.rel] = match.groups.url;
        console.log(`Found ${match.groups.rel} link ${match.groups.url}`);
      }
      return map;
    }, {});

    const data = await response.json();

    // Save response to a file marked to be uploaded as an artifact for debugging
    const fileNameBits = url.match(/\w+/g) ?? [];
    await Bun.write(
      `${fileNameBits.join("-") || "response"}.${
        response.status
      }.artifact.json`,
      JSON.stringify(data, null, 2)
    );

    // GitHub Search API has a secondary rate limit which can report remaining calls but fail with a 403 still :(
    if (response.status !== 200) {
      console.log(
        "X-GitHub-Request-Id:",
        response.headers.get("X-GitHub-Request-Id")
      );
      throw new Error(
        `Errored (${response.status} ${
          response.statusText
        }) mid-way paging while on URL ${url}:\n\n${JSON.stringify(
          data,
          null,
          2
        )}}`
      );
    }

    if (Array.isArray(data)) {
      result.push(...data);
    } else {
      result.push(data);
    }

    url = links.next;
    console.groupEnd();
  } while (url);

  return result;
}
