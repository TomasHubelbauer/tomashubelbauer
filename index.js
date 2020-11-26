import fs from 'fs';

void async function () {
  const data = await fs.promises.readFile('data.json');
  const events = JSON.parse(data);

  let markdown = '';
  let heading = '';
  let more = false;

  for (const event of events) {
    if (event.actor.login !== 'TomasHubelbauer') {
      throw new Error('A non-me event has happened.');
    }

    const [year, month, day, hour, minute] = event.created_at.split(/[-T:]/);

    // TODO: Replace with a human format for certain values (today, yesterday, name of the week day if in the past week)
    const _heading = `## ${year}/${month}/${day}\n\n`;
    if (heading !== _heading) {
      if (heading && !more) {
        markdown += '<details>\n';
        markdown += '<summary>…</summary>\n\n';
        more = true;
      }

      markdown += _heading;
      heading = _heading;
    }

    markdown += `- \`${hour}:${minute}\`: `;

    // https://docs.github.com/en/free-pro-team@latest/developers/webhooks-and-events/github-event-types
    switch (event.type) {
      // https://docs.github.com/en/free-pro-team@latest/developers/webhooks-and-events/github-event-types#createevent
      case 'CreateEvent': {
        switch (event.payload.ref_type) {
          case 'branch': {
            // TODO: Make the branch name into a link to the branch on GitHub
            markdown += `created branch \`${event.payload.ref}\` in ${name(event.repo.name)}`;
            break;
          }
          case 'repository': {
            markdown += `created repository ${name(event.repo.name)}`;
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
        markdown += `forked ${name(event.repo.name)} into ${name(event.payload.forkee.full_name)}`;
        break;
      }

      // https://docs.github.com/en/free-pro-team@latest/developers/webhooks-and-events/github-event-types#issuecommentevent
      case 'IssueCommentEvent': {
        switch (event.payload.action) {
          case 'created': {
            markdown += `commented on ${issue(event.payload.issue)} in ${name(event.repo.name)}`;
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
            markdown += `opened ${issue(event.payload.issue)} in ${name(event.repo.name)}`;
            break;
          }
          case 'closed': {
            markdown += `closed ${issue(event.payload.issue)} in ${name(event.repo.name)}`;
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
        markdown += `pushed ${commit(event.repo, event.payload)}`;
        break;
      }

      // https://docs.github.com/en/free-pro-team@latest/developers/webhooks-and-events/github-event-types#watchevent
      case 'WatchEvent': {
        // TODO: Handle the `payload.action` once they fix it so it is not always `started`
        markdown += `starred ${name(event.repo.name)}`;
        break;
      }

      default: {
        throw new Error(`Unhandled event type: ${event.type}.`);
      }
    }

    markdown += '\n';
  }

  if (more) {
    markdown += '</details>\n';
  }

  markdown += '\n';
  markdown += '---\n';
  markdown += '\n';

  // TODO: Show in an ago format
  markdown += `${new Date().toISOString()}\n`;

  await fs.promises.writeFile('readme.md', markdown);
}()

// TODO: Return user/repo for non-me names
function name(name) {
  const [user, repo] = name.split('/');
  if (user !== 'TomasHubelbauer') {
    return `[\`${name}\`](https://github.com/${name})`;
  }

  return `[\`${repo}\`](https://github.com/${name})`;
}

function commit(repo, payload) {
  if (payload.commits.length === 1) {
    const commit = payload.commits[0];
    return `[*${commit.message}*](https://github.com/${repo.name}/commit/${commit.sha}) into ${name(repo.name)}`;
  }

  const commit = payload.commits[payload.commits.length - 1];
  return `[*${commit.message}*](https://github.com/${repo.name}/commit/${commit.sha}) and ${payload.commits.length - 1} other${payload.commits.length - 2 ? 's' : ''} into ${name(repo.name)}`;
}

function issue(issue) {
  return `[#${issue.number} ${issue.title}](${issue.html_url})`;
}
