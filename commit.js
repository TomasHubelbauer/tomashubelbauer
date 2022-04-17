import name from './name.js';

export default function commit(repo, payload, index = 0) {
  const commit = [...payload.commits].reverse()[index];

  return `\n  [${commit.message.match(/^.*/g)[0]}](https://github.com/${repo.name}/commit/${commit.sha})\n  into${name(repo.name)}`;
}
