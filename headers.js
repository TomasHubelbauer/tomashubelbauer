import login from './login.js';

export default { 'User-Agent': login, Authorization: process.argv[2] ? 'token ' + process.argv[2] : '' };
