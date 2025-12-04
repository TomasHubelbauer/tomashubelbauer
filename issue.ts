export default function issue(issue) {
  return `\n  [#${issue.number} ${issue.title}](${issue.html_url})`;
}
