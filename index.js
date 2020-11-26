import fs from 'fs';
import https from 'https';

void async function () {
  const events = await download();

  let markdown = '';
  let heading = '';
  let more = false;

  for (const event of events) {
    if (event.actor.login !== 'TomasHubelbauer') {
      throw new Error('A non-me event has happened.');
    }

    const _date = new Date(event.created_at);

    // TODO: Replace with a human format for certain values (today, yesterday, name of the week day if in the past week)
    const _heading = date(_date);
    if (heading !== _heading) {
      if (heading && !more) {
        markdown += '\n';
        markdown += '<details>\n';
        markdown += '<summary>…</summary>\n';
        more = true;
      }

      // Skip a heading for "Today"
      if (heading) {
        markdown += '\n';
        markdown += `## ${dates[_heading] || _heading}\n\n`;
      }

      heading = _heading;
    }

    markdown += `- \`${time(_date)}\`\n  `;

    // https://docs.github.com/en/free-pro-team@latest/developers/webhooks-and-events/github-event-types
    switch (event.type) {
      // https://docs.github.com/en/free-pro-team@latest/developers/webhooks-and-events/github-event-types#createevent
      case 'CreateEvent': {
        switch (event.payload.ref_type) {
          case 'branch': {
            // TODO: Make the branch name into a link to the branch on GitHub
            markdown += `created branch \`${event.payload.ref}\` in${name(event.repo.name)}`;
            break;
          }
          case 'repository': {
            markdown += `created repository${name(event.repo.name)}`;
            break;
          }
          default: {
            throw new Error(`Unhandled ref type ${event.payload.ref_type}.`);
          }
        }

        break;
      }

      // https://docs.github.com/en/free-pro-team@latest/developers/webhooks-and-events/github-event-types#forkevent
      case 'ForkEvent': {
        markdown += `forked${name(event.repo.name)}\n  into${name(event.payload.forkee.full_name)}`;
        break;
      }

      // https://docs.github.com/en/free-pro-team@latest/developers/webhooks-and-events/github-event-types#issuecommentevent
      case 'IssueCommentEvent': {
        switch (event.payload.action) {
          case 'created': {
            markdown += `commented on${issue(event.payload.issue)}\n  in${name(event.repo.name)}`;
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
            markdown += `opened${issue(event.payload.issue)}\n  in${name(event.repo.name)}`;
            break;
          }
          case 'closed': {
            markdown += `closed${issue(event.payload.issue)}\n  in${name(event.repo.name)}`;
            break;
          }
          default: {
            throw new Error(`Unhandled issues event ${event.payload.action}.`);
          }
        }

        break;
      }

      // https://docs.github.com/en/free-pro-team@latest/developers/webhooks-and-events/github-event-types#pushevent
      case 'PushEvent': {
        markdown += `pushed${commit(event.repo, event.payload)}`;
        break;
      }

      // https://docs.github.com/en/free-pro-team@latest/developers/webhooks-and-events/github-event-types#watchevent
      case 'WatchEvent': {
        // TODO: Handle the `payload.action` once they fix it so it is not always `started`
        markdown += `starred${name(event.repo.name)}`;
        break;
      }

      default: {
        throw new Error(`Unhandled event type: ${event.type}.`);
      }
    }

    markdown += '\n';
  }

  if (more) {
    markdown += '\n';
    markdown += '</details>\n';
  }

  markdown += '\n';
  markdown += '---\n';
  markdown += '\n';

  // TODO: Show in an ago format
  markdown += `${date(new Date())} ${time(new Date())}\n`;

  await fs.promises.writeFile('readme.md', markdown);
}()

function download() {
  return new Promise((resolve, reject) => {
    const headers = { 'User-Agent': 'TomasHubelbauer' };
    const request = https.get('https://api.github.com/users/tomashubelbauer/events?per_page=100', { headers }, async response => {
      request.on('error', reject);

      const buffers = [];
      for await (const buffer of response) {
        buffers.push(buffer);
      }

      resolve(JSON.parse(Buffer.concat(buffers)));
    });
  });
}

// TODO: Return user/repo for non-me names
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
    return `\n  [*${commit.message}*](https://github.com/${repo.name}/commit/${commit.sha})\n  into${name(repo.name)}`;
  }

  const commit = payload.commits[payload.commits.length - 1];
  return `\n  [*${commit.message}*](https://github.com/${repo.name}/commit/${commit.sha})\n  and ${payload.commits.length - 1} other${payload.commits.length - 2 ? 's' : ''} into${name(repo.name)}`;
}

function issue(issue) {
  return `\n  [#${issue.number} ${issue.title}](${issue.html_url})`;
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
