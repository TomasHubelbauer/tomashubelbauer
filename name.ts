import login from './login.ts';

export default function name(name) {
  const [user, repo] = name.split('/');
  if (user !== login) {
    return `\n  [\`${name}\`](https://github.com/${name})`;
  }

  return `\n  [\`${repo}\`](https://github.com/${name})`;
}
