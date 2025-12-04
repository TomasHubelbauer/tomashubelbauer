import login from './login.ts';

export default { 'User-Agent': login, Authorization: process.argv[2] ? 'token ' + process.argv[2] : '' };
