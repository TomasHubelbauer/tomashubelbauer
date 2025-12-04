import commit from './commit.js';
import time from './time.js';

// https://docs.github.com/en/developers/webhooks-and-events/github-event-types#pushevent
export default function writePushEvent(event) {
  console.log({ event });

  let markdown = `📌 pushed${commit(event.repo, event.payload)}`;
  for (let index = 1; index < event.payload.commits.length; index++) {
    markdown += `\n- \`${time(new Date(event.created_at))}\`\n  `;
    markdown += `📌 pushed${commit(event.repo, event.payload, index)}`;
  }

  return markdown;
}
