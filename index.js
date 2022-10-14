import fs from 'fs';
import todo from 'todo';
import branch from './branch.js';
import commit from './commit.js';
import date from './date.js';
import downloadPages from './downloadPages.js';
import extract from './extract.js';
import headers from './headers.js';
import issue from './issue.js';
import login from './login.js';
import name from './name.js';
import pr from './pr.js';
import time from './time.js';

// Get the annoying `ExperimentalWarning` about `fetch` out of the way…
await fetch('https://example.com');

// Fetch all 300 events GitHub API will provide:
// https://docs.github.com/en/rest/activity/events#list-public-events
/** @type {{ actor: { login: string; }; created_at: string; type: string; payload: unknown; repo: { name: string; }; }[]} */
const events = await downloadPages('https://api.github.com/users/tomashubelbauer/events?per_page=1000');
console.log('Downloaded', events.length, 'events');

// Fetch all repository artifacts used to carry cached data between runs
// https://docs.github.com/en/rest/actions/artifacts#list-artifacts-for-a-repository
const { artifacts } = await fetch('https://api.github.com/repos/tomashubelbauer/tomashubelbauer/actions/artifacts', { headers }).then(response => response.json());
console.log('Downloaded', artifacts.length, 'artifacts');

const response = await fetch(artifacts.find(artifact => artifact.name === 'followers.json').archive_download_url, { headers }).then(response => response.blob());
console.log(await extract(response));

// const repositoriesJsonArtifact = artifacts.find(artifact => artifact.name === 'repositories.json');
// console.log(repositoriesJsonArtifact.archive_download_url);
// const repositoriesJsonZip = await downloadRaw(repositoriesJsonArtifact.archive_download_url);
// console.log(repositoriesJsonZip);
// const repositoriesJson = JSON.parse(await extract(repositoriesJsonZip));
// console.log(repositoriesJson);

// const todosJsonArtifact = artifacts.find(artifact => artifact.name === 'todos.json');
// console.log(todosJsonArtifact.archive_download_url);
// const todosJsonZip = await downloadRaw(todosJsonArtifact.archive_download_url);
// console.log(todosJsonZip);
// const todosJson = JSON.parse(await extract(todosJsonZip));
// console.log(todosJson);

// Recover remembered followers for later comparison and change detection
const staleFollowers = await fs.promises.readFile('followers.json')
  .then(buffer => JSON.parse(buffer))
  .catch(error => {
    if (error.code === 'ENOENT') {
      return [];
    }

    throw error;
  })
  ;

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
    // Skip accounts known to be dead already
    if (deadLogins.includes(follower.login)) {
      continue;
    }

    // Check if the account is dead and if so, mark it as such and skip
    // Use the non-API endpoint because the API is not always accurate on this
    const { status } = await fetch('https://github.com/' + follower.login, true);
    if (status === 404) {
      deadLogins.push(follower.login);
      continue;
    }

    let duration;
    if (follower.followed_at !== '0000-00-00T00:00:00Z') {
      duration = ~~((new Date(follower.unfollowed_at) - new Date(follower.followed_at)) / (1000 * 3600 * 24));
    }

    events.push({ actor: { login }, created_at: follower.unfollowed_at, type: 'FollowerEvent', payload: { action: 'unfollowed', unfollower: follower.login, duration } });
  }

  // Generate follower event (followed) if the user followed earlier than the oldest GitHub activity event returned
  if (follower.followed_at?.localeCompare(cutoff) >= 0) {
    // Skip accounts known to be dead (marked as such by unfollow event)
    if (deadLogins.includes(follower.login)) {
      continue;
    }

    events.push({ actor: { login }, created_at: follower.followed_at, type: 'FollowerEvent', payload: { action: 'followed', newFollower: follower.login } });
  }
}

// Fetch repositories for star and fork change detection
const repositories = await downloadPagedArray('https://api.github.com/users/tomashubelbauer/repos', 'repositories.dev.json');

const todos = await fs.promises.readFile('todos.json')
  .then(buffer => JSON.parse(buffer))
  .catch(error => {
    if (error.code === 'ENOENT') {
      return {};
    }

    throw error;
  })
  ;

// Extract tracked attributes of each repository (used for change detection)
const _repositories = await fs.promises.readFile('repositories.json')
  .then(buffer => JSON.parse(buffer))
  .catch(error => {
    if (error.code === 'ENOENT') {
      return {};
    }

    throw error;
  })
  ;

const deletedRepositories = Object.keys(_repositories).filter(name => !repositories.find(repository => repository.name === name));
for (const deletedRepository of deletedRepositories) {
  console.log('Deleted', deletedRepository);

  // TODO: Mark the repository as deleted until cutoff so we can generate repository-deleted event
  //delete _repositories[deletedRepository];
}

let _stars = 0;
for (const repository of repositories) {
  // Note that `watchers_count` is the same as `stargazers_count` and the real
  // value for watches, `subscribers_count` is not available for the bulk repo
  // endpoint.
  // Note that `open_issues_count` mixes together issues and pull requests and
  // is not distringuishable without fetching individual repo's details.
  const { name, stargazers_count: stars, forks_count: forks, pushed_at } = repository;
  _stars += stars;

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

    if (stat.stars !== _stat.stars && stamp?.localeCompare(cutoff) >= 0) {
      events.push({ actor: { login }, created_at: stamp, type: 'RepositoryEvent', repo: { name: 'TomasHubelbauer/' + repository }, payload: { action: 'starred', old: _stat.stars, new: stat.stars } });
    }

    if (stat.forks !== _stat.forks && stamp?.localeCompare(cutoff) >= 0) {
      events.push({ actor: { login }, created_at: stamp, type: 'RepositoryEvent', repo: { name: 'TomasHubelbauer/' + repository }, payload: { action: 'forked', old: _stat.forks, new: stat.forks } });
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

const forkPrs = await downloadPagedArray('https://api.github.com/search/issues?q=is:pr+is:open+author:tomashubelbauer+-org:tomashubelbauer', 'fork-prs.json');
const forkPrRepos = forkPrs.map(pr => pr.html_url.split('/').slice(3, 5).join('/'));
const forks = repositories.filter(repository => repository.fork);
const identicalForks = [];
for (const fork of forks) {
  const { parent } = await download(fork.url);
  if (!forkPrRepos.includes(parent.full_name)) {
    console.log('Marked', fork.name, 'as identical');
    identicalForks.push(fork.name);
  }
}

const nbsp = '&nbsp;';

const forksMarkDown =
  forks.length === 0
    ? `No${nbsp}forks${nbsp}🍴`
    : forks.length === 1
      ? `[One${nbsp}fork:${nbsp}\`${forks[0].name}\`${nbsp}🍴](${forks[0].html_url})${identicalForks.length > 0 ? ' ᐧ ' : ''}`
      : `[${forks.length}${nbsp}forks${nbsp}🍴](https://github.com/TomasHubelbauer?tab=repositories&q=&type=fork)${identicalForks.length > 0 ? ' ᐧ ' : ''}`
  ;

const identicalForksMarkDown =
  identicalForks.length === 0
    ? ''
    : identicalForks.length === 1
      ? `\n[One${nbsp}identical${nbsp}fork:${nbsp}\`${identicalForks[0]}\`${nbsp}🍴⚠️](https://github.com/tomashubelbauer/${identicalForks[0]})`
      : `\n[${identicalForks.length}${nbsp}identical${nbsp}forks${nbsp}🍴⚠️](identical-forks.json)`
  ;

await fs.promises.writeFile('identical-forks.json', JSON.stringify(identicalForks, null, 2));
if (identicalForks.length === 0) {
  await fs.promises.unlink('identical-forks.json');
}

const followerCount = followers.filter(follower => follower.followed_at && !follower.unfollowed_at).length;

let markdown = `![](banner.svg)

<div align="center">

<img src="https://github.com/TomasHubelbauer/tomashubelbauer/actions/workflows/main.yml/badge.svg">

</div>

<div align="center">

[${followerCount}&nbsp;follower${followerCount === 1 ? '' : 's'}&nbsp;🤝](https://github.com/TomasHubelbauer?tab=followers) ᐧ
${_stars}&nbsp;star${_stars === 1 ? '' : 's'}&nbsp;⭐️  ᐧ
[${repositories.length}&nbsp;repositorie${repositories.length === 1 ? '' : 's'}&nbsp;📓](https://github.com/TomasHubelbauer?tab=repositories) ᐧ
[${issues.length}&nbsp;issue${issues.length === 1 ? '' : 's'}&nbsp;🎫](issues.md) ᐧ
[${prs.length}&nbsp;PR${prs.length === 1 ? '' : 's'}&nbsp;🎁](prs.md) ᐧ
[${Object.keys(todos).length}&nbsp;todo${Object.keys(todos).length === 1 ? '' : 's'}&nbsp;💪](todos.json) ᐧ
${forksMarkDown}${identicalForksMarkDown}

</div>

`;
let heading;

// Sort the events so that any added virtual events are sorted in correctly
events.sort((a, b) => b.created_at.localeCompare(a.created_at));

for (const event of events) {
  if (event.actor.login !== login) {
    throw new Error('A non-me event has happened.');
  }

  if (event.repo?.name?.startsWith(login) && !repositories.find(repository => repository.name === event.repo.name.slice(login.length + '/'.length))) {
    console.log('Skipped', event.type, 'of deleted repository', event.repo?.name || event);
    continue;
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

  // https://docs.github.com/en/developers/webhooks-and-events/github-event-types
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

    // https://docs.github.com/en/developers/webhooks-and-events/github-event-types#createevent
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
        case 'tag': {
          markdown += `🏷 created tag \`${event.payload.ref}\` in${name(event.repo.name)}`;
          break;
        }
        default: {
          throw new Error(`Unhandled ref type ${event.payload.ref_type}.`);
        }
      }

      break;
    }

    // https://docs.github.com/en/developers/webhooks-and-events/github-event-types#deleteevent
    // Note that this event does not include repository deletions
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
          if (event.payload.duration !== undefined) {
            markdown += ` after ${event.payload.duration} days`;
          }

          break;
        }
        default: {
          throw new Error(`Unhandled follower event action ${event.payload.action}.`);
        }
      }

      break;
    }

    // https://docs.github.com/en/developers/webhooks-and-events/github-event-types#forkevent
    case 'ForkEvent': {
      markdown += `🍴 forked${name(event.repo.name)}\n  into${name(event.payload.forkee.full_name)}`;
      break;
    }

    // https://docs.github.com/en/developers/webhooks-and-events/github-event-types#gollumevent
    case 'GollumEvent': {
      // TODO: Flesh this message out further
      markdown += `📃 updated${name(event.repo.name)}\n  wiki page`;
      break;
    }

    // https://docs.github.com/en/developers/webhooks-and-events/github-event-types#issuecommentevent
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

    // https://docs.github.com/en/developers/webhooks-and-events/github-event-types#issuesevent
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
        case 'reopened': {
          markdown += `♻️🎫 reopened${issue(event.payload.issue)}\n  in${name(event.repo.name)}`;
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

    // https://docs.github.com/en/developers/webhooks-and-events/github-event-types#publicevent
    case 'PublicEvent': {
      markdown += `📨 published ${name(event.repo.name)}`;
      break;
    }

    // https://docs.github.com/en/developers/webhooks-and-events/github-event-types#pullrequestevent
    case 'PullRequestEvent': {
      markdown += `🎁 ${event.payload.action}${pr(event.payload.pull_request)}\n  in${name(event.repo.name)}`;
      break;
    }

    // https://docs.github.com/en/developers/webhooks-and-events/events/github-event-types#pullrequestreviewcommentevent
    case 'PullRequestReviewCommentEvent': {
      markdown += `💬 ${event.payload.action}${pr(event.payload.pull_request)}\n  in${name(event.repo.name)}`;
      break;
    }

    // https://docs.github.com/en/developers/webhooks-and-events/events/github-event-types#pullrequestreviewevent
    // TODO: Distinguish between approval and rejection based on payload.review
    case 'PullRequestReviewEvent': {
      markdown += `✔ reviewed ${pr(event.payload.pull_request)}\n  in${name(event.repo.name)}`;
      break;
    }

    // https://docs.github.com/en/developers/webhooks-and-events/github-event-types#pushevent
    case 'PushEvent': {
      markdown += `📌 pushed${commit(event.repo, event.payload)}`;
      for (let index = 1; index < event.payload.commits.length; index++) {
        markdown += `\n- \`${time(_date)}\`\n  `;
        markdown += `📌 pushed${commit(event.repo, event.payload, index)}`;
      }

      break;
    }

    // https://docs.github.com/en/developers/webhooks-and-events/github-event-types#releaseevent
    case 'ReleaseEvent': {
      markdown += `🔪 cut [${event.payload.release.name}](${event.payload.release.html_url})\n  in${name(event.repo.name)}`;
      break;
    }

    // Note that this is a virtual, fake event created above by myself
    case 'RepositoryEvent': {
      switch (event.payload.action) {
        case 'starred': {
          const delta = event.payload.new - event.payload.old;
          const change = delta < 0 ? '📉 lost' : '📈 received';
          const word = delta !== 1 && delta !== -1 ? delta + ' stars' : 'a star';
          markdown += `⭐️${change} ${word} on ${name(event.repo.name)} (now ${event.payload.new || 'none'})`;
          break;
        }

        case 'forked': {
          const delta = event.payload.new - event.payload.old;
          const change = delta < 0 ? '📉 lost' : '📈 received';
          const word = delta !== 1 && delta !== -1 ? delta + 'forks' : 'a fork';
          markdown += `🍴${change} ${word} on ${name(event.repo.name)} (now ${event.payload.new || 'none'})`;
          break;
        }

        default: {
          throw new Error(`Unhandled follower event action ${event.payload.action}.`);
        }
      }

      break;
    }

    // https://docs.github.com/en/developers/webhooks-and-events/github-event-types#watchevent
    case 'WatchEvent': {
      // TODO: Handle the `payload.action` once they fix it so it is not always `started` (sic)
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
