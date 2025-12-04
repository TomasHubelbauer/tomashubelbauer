import commit from './commit.ts';

// https://docs.github.com/en/developers/webhooks-and-events/github-event-types#pushevent
export default function writePushEvent(event) {
  let markdown = `📌 pushed${commit(event.repo, event.payload)}`;

  return markdown;
}
