import type { PullRequest } from "./types.ts";

export default function pr(pr: PullRequest) {
  return `\n  [#${pr.number} ${pr.title}](${pr.html_url})`;
}
