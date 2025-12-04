import name from './name.ts';

export default function branch(repo, payload) {
  return `\n  [\`${payload.ref}\`](https://github.com/${repo.name}/tree/${payload.ref})\n  in${name(repo.name)}`;
}
