export default function pr(pr) {
  return `\n  [#${pr.number} ${pr.title}](${pr.html_url})`;
}
