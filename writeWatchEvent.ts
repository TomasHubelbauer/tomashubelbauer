import name from './name.ts';

// https://docs.github.com/en/developers/webhooks-and-events/github-event-types#watchevent
export default function writeWatchEvent(event) {
  // TODO: Handle the `payload.action` once they fix it so it is not always `started` (sic)
  return `⭐️ starred${name(event.repo.name)}`;
}
