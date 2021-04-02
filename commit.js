import name from './name.js';

export default function commit(repo, payload) {
  if (payload.commits.length === 1) {
    const commit = payload.commits[0];
    return `\n  [${commit.message.match(/^.*/g)[0]}](https://github.com/${repo.name}/commit/${commit.sha})\n  into${name(repo.name)}`;
  }

  const commit = payload.commits[payload.commits.length - 1];
  return `\n  [${commit.message.match(/^.*/g)[0]}](https://github.com/${repo.name}/commit/${commit.sha})\n  and ${payload.commits.length - 1} other${payload.commits.length - 2 ? 's' : ''} into${name(repo.name)}`;
}
