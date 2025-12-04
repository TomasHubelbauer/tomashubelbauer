import name from './name.js';

export default function commit(repo, payload) {
  // TODO: Find out a new way to get the commit name
  return `\n  [commit](https://github.com/${repo.name}/commit/${payload.head})\n  into${name(repo.name)}`;
}
