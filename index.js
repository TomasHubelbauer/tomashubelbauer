import fs from 'fs';
import https from 'https';

// Crash process and bring down the workflow in case of an unhandled rejection
process.on('unhandledRejection', error => { throw error; });

void async function () {
  /** @type {{ actor: { login: string; }; created_at: string; type: string; payload: unknown; repo: { name: string; }; }[]} */
  let events = [];

  // Use cached events to avoid using up the API rate limit in development
  try {
    events = JSON.parse(await fs.promises.readFile('events.json'));
    console.log('Pulled stale cached events');
  }
  catch (error) {
    if (error.code !== 'ENOENT') {
      throw error;
    }

    // Fetch all 300 events GitHub API will provide:
    // https://docs.github.com/en/free-pro-team@latest/rest/reference/activity#events
    // Note that the docs say `per_page` is not supported but it seems to work…
    const pages = Number({ ...await query('https://api.github.com/users/tomashubelbauer/events?per_page=100') }.link.match(/(\d+)>; rel="last"$/)[1]);
    for (let page = 1; page <= pages; page++) {
      events.push(...await download('https://api.github.com/users/tomashubelbauer/events?per_page=100&page=' + page));
      console.log('Fetched events page', page);
    }

    await fs.promises.writeFile('events.json', JSON.stringify(events, null, 2));
    console.log('Cached fresh events');
  }

  // Recover remembered followers for later comparison and change detection
  let staleFollowers = [];
  try {
    staleFollowers = JSON.parse(await fs.promises.readFile('followers.json'));
  }
  catch (error) {
    if (error.code !== 'ENOENT') {
      throw error;
    }
  }

  // Fetch current followers for later comparison and change detection
  let followers = [];
  try {
    followers = JSON.parse(await fs.promises.readFile('followers.dev.json'));
    console.log('Pulled stale cached followers');
  }
  catch (error) {
    if (error.code !== 'ENOENT') {
      throw error;
    }

    const pages = Number({ ...await query('https://api.github.com/users/tomashubelbauer/followers?per_page=100') }.link.match(/(\d+)>; rel="last"$/)[1]);
    for (let page = 1; page <= pages; page++) {
      followers.push(...await download('https://api.github.com/users/tomashubelbauer/followers?per_page=100&page=' + page));
      console.log('Fetched followers page', page);
    }

    await fs.promises.writeFile('followers.dev.json', JSON.stringify(followers, null, 2));
    console.log('Cached fresh followers');
  }

  const freshFollowers = followers.map(follower => follower.login);
  await fs.promises.writeFile('followers.json', JSON.stringify(freshFollowers, null, 2));

  // Detect new followers and push virtual events for those
  const newFollowers = freshFollowers.filter(follower => !staleFollowers.includes(follower));
  for (const newFollower of newFollowers) {
    events.unshift({ actor: { login: 'TomasHubelbauer' }, created_at: new Date().toISOString().slice(0, 19) + 'Z', type: 'FollowerEvent', payload: { action: 'followed', newFollower } });
  }

  // Detect unfollowers and push virtual events for those
  const unfollowers = staleFollowers.filter(follower => !freshFollowers.includes(follower));
  for (const unfollower of unfollowers) {
    events.unshift({ actor: { login: 'TomasHubelbauer' }, created_at: new Date().toISOString().slice(0, 19) + 'Z', type: 'FollowerEvent', payload: { action: 'unfollowed', unfollower } });
  }

  // Fetch repositories for star and fork change detection
  let repositories = [];
  try {
    repositories = JSON.parse(await fs.promises.readFile('repositories.dev.json'));
    console.log('Pulled stale cached repositories');
  }
  catch (error) {
    if (error.code !== 'ENOENT') {
      throw error;
    }

    const pages = Number({ ...await query('https://api.github.com/users/tomashubelbauer/repos?per_page=100') }.link.match(/(\d+)>; rel="last"$/)[1]);
    for (let page = 1; page <= pages; page++) {
      repositories.push(...await download('https://api.github.com/users/tomashubelbauer/repos?per_page=100&page=' + page));
      console.log('Fetched repositories page', page);
    }

    await fs.promises.writeFile('repositories.dev.json', JSON.stringify(repositories, null, 2));
    console.log('Cached fresh repositories');
  }

  // Extract tracked attributes of each repository (used for change detection)
  const repos = repositories.map(repository => {
    const { name, size, stargazers_count, watchers_count, forks_count, open_issues_count, } = repository;
    return { name, size, stars: stargazers_count, watches: watchers_count, forks: forks_count, issues: open_issues_count };
  });

  await fs.promises.writeFile('repositories.json', JSON.stringify(repos, null, 2));

  const forks = repositories.filter(repository => repository.fork);

  let markdown = `![](banner.svg)

<div align="center">

<img src="https://github.com/TomasHubelbauer/tomashubelbauer/actions/workflows/main.yml/badge.svg">

</div>

<div align="center">

[${followers.length} followers 🤝](https://github.com/TomasHubelbauer?tab=followers) ᐧ
[${repositories.length} repositories 📓](https://github.com/TomasHubelbauer?tab=repositories) ᐧ
[${forks.length} forks 🍴](https://github.com/TomasHubelbauer?tab=repositories&q=&type=fork)

</div>

`;
  let heading;

  for (const event of events) {
    if (event.actor.login !== 'TomasHubelbauer') {
      throw new Error('A non-me event has happened.');
    }

    const _date = new Date(event.created_at);

    const _heading = date(_date);
    if (heading !== _heading) {
      if (heading) {
        markdown += '\n';
        markdown += '</details>\n';
        markdown += '\n';
      }

      markdown += `<details${!heading ? ' open' : ''}>\n`;
      markdown += `<summary>${dates[_heading] || _heading}${_heading === 'Today' ? ` (${time(new Date())})` : ''}</summary>\n`;
      markdown += '\n';
      heading = _heading;
    }

    markdown += `- \`${time(_date)}\`\n  `;

    // https://docs.github.com/en/free-pro-team@latest/developers/webhooks-and-events/github-event-types
    switch (event.type) {
      // https://docs.github.com/en/developers/webhooks-and-events/github-event-types#commitcommentevent
      case 'CommitCommentEvent': {
        switch (event.payload.action) {
          // Handle GitHub API not responding as documented (missing payload `action` field)
          case undefined:
          case 'created': {
            // TODO: Flesh this out properly
            markdown += `💬 commented on a commit\n  in${name(event.repo.name)}`;
            break;
          }
          default: {
            throw new Error(`Unhandled commit comment event ${event.payload.action}.`);
          }
        }

        break;
      }

      // https://docs.github.com/en/free-pro-team@latest/developers/webhooks-and-events/github-event-types#createevent
      case 'CreateEvent': {
        switch (event.payload.ref_type) {
          case 'branch': {
            markdown += `🌳 created branch ${branch(event.repo, event.payload)}`;
            break;
          }
          case 'repository': {
            markdown += `📓 created repository${name(event.repo.name)}`;
            break;
          }
          default: {
            throw new Error(`Unhandled ref type ${event.payload.ref_type}.`);
          }
        }

        break;
      }

      // https://docs.github.com/en/free-pro-team@latest/developers/webhooks-and-events/github-event-types#deleteevent
      case 'DeleteEvent': {
        switch (event.payload.ref_type) {
          case 'tag': {
            markdown += `🗑🏷 deleted tag \`${event.payload.ref}\` in${name(event.repo.name)}`;
            break;
          }
          case 'branch': {
            markdown += `🗑🌳 deleted branch \`${event.payload.ref}\` in${name(event.repo.name)}`;
            break;
          }
          default: {
            throw new Error(`Unhandled ref type ${event.payload.ref_type}.`);
          }
        }

        break;
      }

      // Note that this is a virtual, fake event created above by myself
      case 'FollowerEvent': {
        switch (event.payload.action) {
          case 'followed': {
            markdown += `🤝 gained follower [${event.payload.newFollower}](https://github.com/${event.payload.newFollower})`;
            break;
          }
          case 'unfollowed': {
            markdown += `💔 lost follower [${event.payload.unfollower}](https://github.com/${event.payload.unfollower})`;
            break;
          }
          default: {
            throw new Error(`Unhandled follower event action ${event.payload.action}.`);
          }
        }

        break;
      }

      // https://docs.github.com/en/free-pro-team@latest/developers/webhooks-and-events/github-event-types#forkevent
      case 'ForkEvent': {
        markdown += `🍴 forked${name(event.repo.name)}\n  into${name(event.payload.forkee.full_name)}`;
        break;
      }

      // https://docs.github.com/en/free-pro-team@latest/developers/webhooks-and-events/github-event-types#issuecommentevent
      case 'IssueCommentEvent': {
        switch (event.payload.action) {
          case 'created': {
            markdown += `💬 commented on${issue(event.payload.issue)}\n  in${name(event.repo.name)}`;
            break;
          }
          default: {
            throw new Error(`Unhandled issue comment event ${event.payload.action}.`);
          }
        }

        break;
      }

      // https://docs.github.com/en/free-pro-team@latest/developers/webhooks-and-events/github-event-types#issuesevent
      case 'IssuesEvent': {
        switch (event.payload.action) {
          case 'created': {
            markdown += `🎫 opened${issue(event.payload.issue)}\n  in${name(event.repo.name)}`;
            break;
          }
          case 'opened': {
            markdown += `🎫 opened${issue(event.payload.issue)}\n  in${name(event.repo.name)}`;
            break;
          }
          case 'closed': {
            markdown += `🗑🎫 closed${issue(event.payload.issue)}\n  in${name(event.repo.name)}`;
            break;
          }
          default: {
            throw new Error(`Unhandled issues event ${event.payload.action}.`);
          }
        }

        break;
      }

      // https://docs.github.com/en/developers/webhooks-and-events/github-event-types#memberevent
      case 'MemberEvent': {
        // TODO: Flesh this out properly
        markdown += `👷‍♂️ ${event.payload.action} a member\n  in${name(event.repo.name)}`;
        break;
      }

      // https://docs.github.com/en/free-pro-team@latest/developers/webhooks-and-events/github-event-types#pullrequestevent
      case 'PullRequestEvent': {
        markdown += `🎁 ${event.payload.action}${pr(event.payload.pull_request)}\n  in${name(event.repo.name)}`;
        break;
      }

      // https://docs.github.com/en/free-pro-team@latest/developers/webhooks-and-events/github-event-types#pushevent
      case 'PushEvent': {
        markdown += `📌 pushed${commit(event.repo, event.payload)}`;
        break;
      }

      // https://docs.github.com/en/free-pro-team@latest/developers/webhooks-and-events/github-event-types#watchevent
      case 'WatchEvent': {
        // TODO: Handle the `payload.action` once they fix it so it is not always `started`
        markdown += `⭐️ starred${name(event.repo.name)}`;
        break;
      }

      default: {
        throw new Error(`Unhandled event type: ${event.type}.`);
      }
    }

    markdown += '\n';
  }

  markdown += '\n';
  markdown += '</details>\n';

  await fs.promises.writeFile('readme.md', markdown);
}()

function query(url) {
  return new Promise((resolve, reject) => {
    const headers = { 'User-Agent': 'TomasHubelbauer' };
    const request = https.get(url, { headers }, async response => {
      request.on('error', reject);
      resolve(response.headers);
    });
  });
}

function download(url) {
  return new Promise((resolve, reject) => {
    const headers = { 'User-Agent': 'TomasHubelbauer' };
    const request = https.get(url, { headers }, async response => {
      request.on('error', reject);

      const buffers = [];
      for await (const buffer of response) {
        buffers.push(buffer);
      }

      const data = JSON.parse(Buffer.concat(buffers));
      if (Array.isArray(data)) {
        resolve(data);
      }
      else {
        reject(data);
      }
    });
  });
}

function name(name) {
  const [user, repo] = name.split('/');
  if (user !== 'TomasHubelbauer') {
    return `\n  [\`${name}\`](https://github.com/${name})`;
  }

  return `\n  [\`${repo}\`](https://github.com/${name})`;
}

function commit(repo, payload) {
  if (payload.commits.length === 1) {
    const commit = payload.commits[0];
    return `\n  [${commit.message}](https://github.com/${repo.name}/commit/${commit.sha})\n  into${name(repo.name)}`;
  }

  const commit = payload.commits[payload.commits.length - 1];
  return `\n  [${commit.message}](https://github.com/${repo.name}/commit/${commit.sha})\n  and ${payload.commits.length - 1} other${payload.commits.length - 2 ? 's' : ''} into${name(repo.name)}`;
}

function branch(repo, payload) {
  return `\n  [\`${payload.ref}\`](https://github.com/${repo.name}/tree/${payload.ref})\n  in${name(repo.name)}`;
}

function issue(issue) {
  return `\n  [#${issue.number} ${issue.title}](${issue.html_url})`;
}

function pr(pr) {
  return `\n  [#${pr.number} ${pr.title}](${pr.html_url})`;
}

let now = new Date();
const dates = {};
for (let index = 0; index < 7; index++) {
  const date = now.toISOString().slice(0, 10);
  if (index === 0) {
    dates[date] = 'Today';
  }
  else if (index === 1) {
    dates[date] = 'Yesterday';
  }
  else {
    dates[date] = now.toLocaleDateString('en-US', { weekday: 'long' });
  }

  now = new Date(now.setDate(now.getDate() - 1));
}

function date(instant) {
  const date = instant.toISOString().slice(0, 10);
  return dates[date] || date;
}

function time(instant) {
  return instant.toISOString().slice(11, 16);
}
