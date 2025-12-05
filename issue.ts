import type { Issue } from "./types.ts";

export default function issue(issue: Issue) {
  return `\n  [#${issue.number} ${issue.title}](${issue.html_url})`;
}
