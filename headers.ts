import login from './login.ts';

export default { 'User-Agent': login, Authorization: process.env.GITHUB_TOKEN ? 'token ' + process.env.GITHUB_TOKEN : '' };
