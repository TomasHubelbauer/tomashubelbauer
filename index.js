import fs from 'fs';
import downloadPagedArray from './downloadPagedArray.js';
import query from './query.js';
import name from './name.js';
import commit from './commit.js';
import branch from './branch.js';
import issue from './issue.js';
import pr from './pr.js';
import date from './date.js';
import time from './time.js';
import download from './download.js';
import todo from 'todo';

// Crash process and bring down the workflow in case of an unhandled rejection
process.on('unhandledRejection', error => { throw error; });

void async function () {
  // Fetch all 300 events GitHub API will provide:
  // https://docs.github.com/en/free-pro-team@latest/rest/reference/activity#events
  // Note that the docs say `per_page` is not supported but it seems to work…
  /** @type {{ actor: { login: string; }; created_at: string; type: string; payload: unknown; repo: { name: string; }; }[]} */
  const events = await downloadPagedArray('https://api.github.com/users/tomashubelbauer/events', 'events.json');

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
  const freshFollowers = await downloadPagedArray('https://api.github.com/users/tomashubelbauer/followers', 'followers.dev.json');

  // Get the unique names of both stale and fresh followers to get the whole set
  const logins = [
    ...staleFollowers.map(follower => follower.login),
    ...freshFollowers.map(follower => follower.login),
  ].filter((login, index, array) => array.indexOf(login) === index);

  const followers = [];
  const stamp = new Date().toISOString().slice(0, 19) + 'Z';
  for (const login of logins) {
    const followed_at = staleFollowers.find(follower => follower.login === login)?.followed_at ?? stamp;
    const unfollowed_at = freshFollowers.find(follower => follower.login === login) ? undefined : (staleFollowers.find(follower => follower.login === login)?.unfollowed_at ?? stamp);
    followers.push({ login, followed_at, unfollowed_at });
  }

  await fs.promises.writeFile('followers.json', JSON.stringify(followers, null, 2));

  // Keep a list of accounts found to be dead to skip in unfollow-follow events
  const deadLogins = [];

  const cutoff = events[events.length - 1].created_at;
  for (const follower of followers) {
    // Generate follower event (unfollowed) if the user unfollowed earlier than the oldest GitHub activity event returned
    if (follower.unfollowed_at?.localeCompare(cutoff) >= 0) {
      console.log('Skipped unfollower', follower.login, '(dead login)');

      // Skip accounts known to be dead already
      if (deadLogins.includes(follower.login)) {
        continue;
      }

      // Check if the account is dead and if so, mark it as such and skip
      // Use the non-API endpoint because the API is not always accurate on this
      const code = await query('https://github.com/' + follower.login, true);
      if (code === 404) {
        deadLogins.push(follower.login);
        continue;
      }

      events.push({ actor: { login: 'TomasHubelbauer' }, created_at: follower.unfollowed_at, type: 'FollowerEvent', payload: { action: 'unfollowed', unfollower: follower.login } });
    }

    // Generate follower event (followed) if the user followed earlier than the oldest GitHub activity event returned
    if (follower.followed_at?.localeCompare(cutoff) >= 0) {
      // Skip accounts known to be dead (marked as such by unfollow event)
      if (deadLogins.includes(follower.login)) {
        continue;
      }

      events.push({ actor: { login: 'TomasHubelbauer' }, created_at: follower.followed_at, type: 'FollowerEvent', payload: { action: 'followed', newFollower: follower.login } });
    }
  }

  // Fetch repositories for star and fork change detection
  const repositories = await downloadPagedArray('https://api.github.com/users/tomashubelbauer/repos', 'repositories.dev.json');

  const todos = JSON.parse(await fs.promises.readFile('todos.json'));

  // Extract tracked attributes of each repository (used for change detection)
  const _repositories = JSON.parse(await fs.promises.readFile('repositories.json'));
  for (const repository of repositories) {
    // Note that `watchers_count` is the same as `stargazers_count` and the real
    // value for watches, `subscribers_count` is not available for the bulk repo
    // endpoint.
    // Note that `open_issues_count` mixes together issues and pull requests and
    // is not distringuishable without fetching individual repo's details.
    const { name, stargazers_count: stars, forks_count: forks, pushed_at } = repository;

    // TODO: Drop entries that are older than the cutoff and no longer contribute
    // Record the changes only if there are any to speak of - ignore non-changes
    let stats = _repositories[name];
    if (!stats) {
      stats = _repositories[name] = {};
    }

    const stat = stats[Object.keys(stats).pop()];
    if (!stat || stars !== stat.stars || forks !== stat.forks) {
      stats[stamp] = { stars, forks };
    }

    // Update the repository readme todos if it was pushed to since the last capture
    if (name !== 'tomashubelbauer' && todos[name]?.stamp !== pushed_at) {
      const readme = todos[name]?.readme ?? 'readme.md';
      let content;

      // Download the readme at the remembered or default name
      try {
        content = await download(`https://api.github.com/repos/TomasHubelbauer/${name}/contents/${readme}`);
        if (content.message === 'Not Found') {
          throw new Error(content);
        }
      }

      // Download the readme at the alternate name or fail
      catch (error) {
        const oppositeReadme = readme === 'readme.md' ? 'README.md' : 'readme.md';
        content = await download(`https://api.github.com/repos/TomasHubelbauer/${name}/contents/${oppositeReadme}`);
      }

      if (content.message?.startsWith('API rate limit exceeded')) {
        throw new Error(content.message);
      }

      if (content.message === 'This repository is empty.') {
        continue;
      }

      if (content.message?.startsWith('Not Found')) {
        console.log(name, 'readme not found');
        continue;
      }

      content = Buffer.from(content.content, 'base64');
      await fs.promises.writeFile(name + '.' + readme, content);

      // Do not use `??=` because the GitHub Actions Node version is too old
      if (!todos[name]) {
        todos[name] = {};
      }

      todos[name].stamp = pushed_at;
      todos[name].todos = [];
      for await (const { text } of todo('.', name + '.' + readme)) {
        todos[name].todos.push(text);
      }

      await fs.promises.unlink(name + '.' + readme);
    }
  }

  for (const name in todos) {
    if (!repositories.find(repository => repository.name === name)) {
      delete todos[name];
    }
  }

  await fs.promises.writeFile('todos.json', JSON.stringify(Object.fromEntries(Object.entries(todos).sort()), null, 2));

  // Sort the repositories object by key before persisting it to the change
  await fs.promises.writeFile('repositories.json', JSON.stringify(Object.fromEntries(Object.entries(_repositories).sort()), null, 2));

  // Compare changes between repository attributes and generate events for them
  // Note that repo creations and deletions are handled by GitHub Activity API
  for (const repository in _repositories) {
    let _stat;
    const stats = _repositories[repository];
    for (const stamp in stats) {
      const stat = stats[stamp];
      // Set the first stat as the comparison basis and continue
      if (!_stat) {
        _stat = stat;
        continue;
      }

      if (stat.stars !== _stat.stars) {
        events.push({ actor: { login: 'TomasHubelbauer' }, created_at: stamp, type: 'RepositoryEvent', payload: { action: 'starred', old: _stat.stars, new: stat.stars, repo: repository } });
      }

      if (stat.forks !== _stat.forks) {
        events.push({ actor: { login: 'TomasHubelbauer' }, created_at: stamp, type: 'RepositoryEvent', payload: { action: 'forked', old: _stat.forks, new: stat.forks, repo: repository } });
      }

      _stat = stat;
    }
  }

  const issuesAndPrs = await downloadPagedArray('https://api.github.com/search/issues?q=org:tomashubelbauer+is:open', 'issues-and-prs.json');

  const issues = issuesAndPrs.filter(issueOrPr => !issueOrPr.pull_request).map(issue => ({
    repo: issue.html_url.split('/')[4],
    title: issue.title,
    url: issue.html_url,
  }));

  const issueGroups = issues.reduce((groups, issue) => { groups[issue.repo] = groups[issue.repo] ?? []; groups[issue.repo].push(issue); return groups; }, {});
  const issuesMarkDown = '# Issues\n\n' + Object
    .keys(issueGroups)
    .sort()
    .map(group => issueGroups[group])
    .map(group => `## ${group[0].repo}\n\n${group.map(issue => `- [${issue.title}](${issue.url})`).join('\n')}`)
    .join('\n\n') + '\n'
    ;
  await fs.promises.writeFile('issues.md', issuesMarkDown);

  const prs = issuesAndPrs.filter(issueOrPr => issueOrPr.pull_request).map(pr => ({
    repo: pr.html_url.split('/')[4],
    title: pr.title,
    url: pr.html_url,
  }));

  const prGroups = prs.reduce((groups, pr) => { groups[pr.repo] = groups[pr.repo] ?? []; groups[pr.repo].push(pr); return groups; }, {});
  const prsMarkDown = '# Pull Requests\n\n' + Object
    .keys(prGroups)
    .sort()
    .map(group => prGroups[group])
    .map(group => `## ${group[0].repo}\n\n${group.map(pr => `- [${pr.title}](${pr.url})`).join('\n')}`)
    .join('\n\n') + '\n'
    ;
  await fs.promises.writeFile('prs.md', prsMarkDown);

  const forks = repositories.filter(repository => repository.fork);
  const followerCount = followers.filter(follower => follower.followed_at && !follower.unfollowed_at).length;

  let markdown = `![](banner.svg)

<div align="center">

<img src="https://github.com/TomasHubelbauer/tomashubelbauer/actions/workflows/main.yml/badge.svg">

</div>

<div align="center">

[${followerCount} followers 🤝](https://github.com/TomasHubelbauer?tab=followers) ᐧ
[${repositories.length} repositories 📓](https://github.com/TomasHubelbauer?tab=repositories) ᐧ
[${issues.length} issues 🎫](issues.md) ᐧ
[${prs.length} PRs 🎁](prs.md) ᐧ
[${Object.keys(todos).length} todos 💪](todos.json) ᐧ
[${forks.length || 'No'} forks 🍴](https://github.com/TomasHubelbauer?tab=repositories&q=&type=fork)

</div>

<div align="center">

[(random repo)](https://tomashubelbauer.github.io/tomashubelbauer/random?now)

</div>

`;
  let heading;

  // Sort the events so that any added virtual events are sorted in correctly
  events.sort((a, b) => b.created_at.localeCompare(a.created_at));

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
      markdown += `<summary>${_heading}${_heading === 'Today' ? ` (${time(new Date())})` : ''}</summary>\n`;
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
            markdown += `🤝 followed by [${event.payload.newFollower}](https://github.com/${event.payload.newFollower})`;
            break;
          }
          case 'unfollowed': {
            markdown += `💔 unfollowed by [${event.payload.unfollower}](https://github.com/${event.payload.unfollower})`;
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

      // Note that this is a virtual, fake event created above by myself
      case 'RepositoryEvent': {
        // TODO: Display repository name as link as in other events
        switch (event.payload.action) {
          case 'starred': {
            const delta = event.payload.new - event.payload.old;
            const change = delta < 0 ? '📉 lost' : '📈 received';
            const word = delta !== 1 && delta !== -1 ? delta + ' stars' : 'a star';
            markdown += `⭐️${change} ${word} on [${event.payload.repo}](https://github.com/tomashubelbauer/${event.payload.repo}) (now ${event.payload.new || 'none'})`;
            break;
          }

          case 'forked': {
            const delta = event.payload.new - event.payload.old;
            const change = delta < 0 ? '📉 lost' : '📈 received';
            const word = delta !== 1 && delta !== -1 ? delta + 'forks' : 'a fork';
            markdown += `🍴${change} ${word} on [${event.payload.repo}](https://github.com/tomashubelbauer/${event.payload.repo}) (now ${event.payload.new || 'none'})`;
            break;
          }

          default: {
            throw new Error(`Unhandled follower event action ${event.payload.action}.`);
          }
        }

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
